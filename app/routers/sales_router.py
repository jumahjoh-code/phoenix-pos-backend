from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import logging
import traceback

from app.core.database import get_db
from app.services.sales_service import create_sale, confirm_sale_payment
from app.models.sale import Sale
from app.models.sale_item import SaleItem
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
        "id": sale.id,
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
# 🔥 RECORD SALE
# =========================
@router.post("/")
def record_sale(data: SaleCreate, db: Session = Depends(get_db)):
    try:
        with db.begin():
            sale = create_sale(db=db, payload=data)
            sale.record_ledger_entries(db)

        db.refresh(sale)

        return build_receipt(sale)

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Failed to record sale")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 🔥 CONFIRM PAYMENT
# =========================
@router.post("/{sale_id}/confirm-payment")
def confirm_payment(sale_id: int, payload: PaymentConfirm, db: Session = Depends(get_db)):
    try:
        with db.begin():
            sale, message = confirm_sale_payment(db=db, sale_id=sale_id, payload=payload)

        return {"message": message, "sale_id": sale.id}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to confirm payment for sale_id=%s", sale_id)
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# 📜 LIST SALES
# =========================
@router.get("/")
def list_sales(db: Session = Depends(get_db)):

    sales = db.query(Sale).order_by(Sale.id.desc()).all()

    return [
        {
            "id": sale.id,
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
# 📊 DASHBOARD DAILY REPORT
# =========================
@router.get("/reports/daily")
def dashboard_daily(range: str = "today", db: Session = Depends(get_db)):

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
# 📊 TOP PRODUCTS
# =========================
@router.get("/reports/top-products")
def top_products(db: Session = Depends(get_db)):

    results = (
        db.query(
            Product.name,
            func.sum(SaleItem.quantity)
        )
        .join(SaleItem, Product.id == SaleItem.product_id)
        .group_by(Product.name)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
        .all()
    )

    return [
        {"name": r[0], "quantity": int(r[1])}
        for r in results
    ]


# =========================
# 📊 WORST PRODUCTS
# =========================
@router.get("/reports/worst-products")
def worst_products(db: Session = Depends(get_db)):

    results = (
        db.query(
            Product.name,
            func.sum(SaleItem.quantity)
        )
        .join(SaleItem, Product.id == SaleItem.product_id)
        .group_by(Product.name)
        .order_by(func.sum(SaleItem.quantity).asc())
        .limit(5)
        .all()
    )

    return [
        {"name": r[0], "quantity": int(r[1])}
        for r in results
    ]


# =========================
# 📊 CASHIER PERFORMANCE
# =========================
@router.get("/cashier-performance")
def cashier_performance(db: Session = Depends(get_db)):

    results = (
        db.query(
            User.username,
            func.count(Sale.id),
            func.coalesce(func.sum(Sale.total_amount), 0)
        )
        .join(Sale, Sale.user_id == User.id)
        .group_by(User.username)
        .all()
    )

    return [
        {
            "cashier": r[0],
            "transactions": r[1],
            "total_sales": float(r[2])
        }
        for r in results
    ]
