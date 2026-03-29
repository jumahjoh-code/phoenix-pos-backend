from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from app.core.database import get_db
from app.services.sales_service import create_sale
from app.models.sale import Sale
from app.models.user import User


router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


# =========================
# HELPER: BUILD RECEIPT
# =========================
def build_receipt(sale):
    return {
        "sale_id": sale.id,
        "receipt_number": sale.receipt_number,
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
        "total_amount": float(sale.total_amount),
        "cost_total": float(sale.cost_total),
        "profit": float(sale.profit),
        "amount_paid": float(sale.amount_paid),
        "balance": float(sale.balance),
        "payment_method": sale.payment_method,
        "status": sale.status
    }


# =========================
# RECORD SALE
# =========================
@router.post("/")
def record_sale(data: dict, db: Session = Depends(get_db)):

    items = data.get("items")
    total = data.get("total")
    amount_paid = float(data.get("amount_paid", 0))
    user_id = data.get("user_id")
    payment_method = data.get("payment_method", "cash")
    mpesa_reference = data.get("mpesa_reference")

    # VALIDATION
    if not items or not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Items must be a non-empty list")

    if total is None:
        raise HTTPException(status_code=400, detail="Total is required")

    try:
        sale = create_sale(db, items, total, amount_paid, user_id)

        # PAYMENT DETAILS
        sale.payment_method = payment_method
        sale.mpesa_reference = mpesa_reference

        db.commit()
        db.refresh(sale)

        # LEDGER AUTO-POST
        if hasattr(sale, "record_ledger_entries"):
            sale.record_ledger_entries(db)
            db.commit()

        return build_receipt(sale)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Sale failed: {str(e)}")


# =========================
# LIST SALES
# =========================
@router.get("/")
def list_sales(db: Session = Depends(get_db)):

    sales = db.query(Sale).order_by(Sale.id.desc()).all()

    return [
        {
            "sale_id": sale.id,
            "date": sale.created_at,
            "user": sale.user.username if sale.user else None,
            "total_amount": float(sale.total_amount),
            "amount_paid": float(sale.amount_paid),
            "balance": float(sale.balance),
            "payment_method": sale.payment_method,
            "status": sale.status
        }
        for sale in sales
    ]


# =========================
# GET SINGLE SALE
# =========================
@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):

    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return build_receipt(sale)


# =========================
# TODAY SUMMARY
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
        "transactions": int(transactions),
        "total_sales": float(total_sales),
        "total_cost": float(total_cost),
        "profit": float(total_sales - total_cost),
        "cash_collected": float(cash_collected)
    }


# =========================
# CASHIER PERFORMANCE
# =========================
@router.get("/reports/cashier-performance")
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
            "transactions": int(transactions),
            "total_sales": float(total_sales),
            "profit": float(total_sales - total_cost)
        })

    return data
