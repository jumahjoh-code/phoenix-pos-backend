from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import date
import logging

from app.core.database import get_db
from app.services.sales_service import create_sale
from app.models.sale import Sale
from app.models.user import User
from app.models.product import Product
from app.schemas.sale import SaleCreate, PaymentConfirm

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)

logger = logging.getLogger(__name__)


# =========================
# 🔥 HELPER: BUILD RECEIPT
# =========================
def build_receipt(sale):
    return {
        "sale_id": sale.id,
        "receipt_number": sale.receipt_number,
        "source": sale.source,
        "status": sale.status,
        "date": sale.created_at,
        "user": sale.user.username if sale.user else None,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Item",
                "quantity": item.quantity,
                "price": item.price,
                "total": item.quantity * item.price
            }
            for item in sale.items
        ],
        "total_amount": sale.total_amount,
        "cost_total": sale.cost_total,
        "profit": sale.profit,
        "amount_paid": sale.amount_paid,
        "balance": sale.balance,
        "payment_method": sale.payment_method,
    }


# =========================
# 🔥 RECORD SALE (FINAL)
# =========================
@router.post("/")
def record_sale(data: SaleCreate, db: Session = Depends(get_db)):

    if not data.items:
        raise HTTPException(status_code=400, detail="No items provided")

    try:
        # =========================
        # 🔥 ANTI-FRAUD TOTAL CHECK
        # =========================
        calculated_total = sum(
            item.quantity * item.unit_price for item in data.items
        )

        if abs(calculated_total - data.total_amount) > 1:
            raise HTTPException(status_code=400, detail="Total mismatch detected")

        # =========================
        # 🔥 STOCK VALIDATION
        # =========================
        for item in data.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product {item.product_id} not found"
                )

            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for {product.name}"
                )

        # =========================
        # 🔥 CREATE SALE
        # =========================
        sale = create_sale(
            db=db,
            items=[item.dict() for item in data.items],
            total=data.total_amount,
            amount_paid=data.amount_paid or 0,
            user_id=data.user_id
        )

        # APPLY EXTRA FIELDS
        sale.source = data.source
        sale.status = data.status
        sale.payment_method = data.payment_method
        sale.mpesa_reference = data.mpesa_reference

        # =========================
        # 🔥 PAYMENT LOGIC
        # =========================
        if sale.status == "paid":
            sale.amount_paid = data.amount_paid or data.total_amount
            sale.balance = max(sale.total_amount - sale.amount_paid, 0)
        else:
            sale.amount_paid = 0
            sale.balance = sale.total_amount

        # =========================
        # 🔥 DEDUCT STOCK
        # =========================
        for item in data.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            product.stock_quantity -= item.quantity

        db.commit()
        db.refresh(sale)

        # =========================
        # 🔥 LEDGER ENTRY
        # =========================
        sale.record_ledger_entries(db)
        db.commit()

        return build_receipt(sale)

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Sale error: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to process sale")


# =========================
# 🔥 CONFIRM PAYMENT
# =========================
@router.post("/{sale_id}/confirm-payment")
def confirm_payment(sale_id: int, payload: PaymentConfirm, db: Session = Depends(get_db)):

    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if sale.status == "paid":
        return {"message": "Already paid"}

    sale.mark_as_paid(
        db=db,
        amount=payload.amount,
        method=payload.method,
        mpesa_ref=payload.mpesa_reference
    )

    return {"message": "Payment confirmed", "sale_id": sale.id}


# =========================
# 📜 LIST SALES
# =========================
@router.get("/")
def list_sales(db: Session = Depends(get_db)):

    sales = db.query(Sale).order_by(Sale.id.desc()).all()

    return [
        {
            "sale_id": sale.id,
            "date": sale.created_at,
            "source": sale.source,
            "status": sale.status,
            "user": sale.user.username if sale.user else None,
            "total_amount": sale.total_amount,
            "amount_paid": sale.amount_paid,
            "balance": sale.balance,
            "payment_method": sale.payment_method,
        }
        for sale in sales
    ]


# =========================
# 📊 TODAY SUMMARY
# =========================
@router.get("/summary/today")
def today_summary(db: Session = Depends(get_db)):

    today = date.today()

    result = db.query(
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), 0),
        func.coalesce(func.sum(Sale.cost_total), 0),
        func.coalesce(func.sum(Sale.amount_paid), 0)
    ).filter(
        func.date(Sale.created_at) == today
    ).first()

    transactions, total_sales, total_cost, cash_collected = result

    return {
        "transactions": transactions,
        "total_sales": float(total_sales),
        "total_cost": float(total_cost),
        "profit": float(total_sales - total_cost),
        "cash_collected": float(cash_collected)
    }


# =========================
# 👨‍💼 CASHIER PERFORMANCE
# =========================
@router.get("/cashier-performance")
def cashier_performance(db: Session = Depends(get_db)):

    results = db.query(
        Sale.user_id,
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), 0),
        func.coalesce(func.sum(Sale.cost_total), 0)
    ).group_by(Sale.user_id).all()

    data = []

    for user_id, transactions, total_sales, total_cost in results:
        user = db.query(User).filter(User.id == user_id).first()

        data.append({
            "user_id": user_id,
            "username": user.username if user else "Unknown",
            "transactions": transactions,
            "total_sales": float(total_sales),
            "profit": float(total_sales - total_cost)
        })

    return data


# =========================
# 🔍 GET SINGLE SALE
# =========================
@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):

    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return build_receipt(sale)