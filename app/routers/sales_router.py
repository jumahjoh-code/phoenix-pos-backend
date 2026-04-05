from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
import time

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.sales_service import create_sale
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User


router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


# =========================
# HELPER: BUILD RECEIPT
# =========================
def build_receipt(sale, current_user=None):
    return {
        "sale_id": sale.id,
        "receipt_number": sale.receipt_number,
        "date": sale.created_at,
        "user": current_user.username if current_user else (sale.user.username if sale.user else None),
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
# COMPLETE SALE (ATOMIC)
# =========================
@router.post("/complete")
def complete_sale(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = data.get("items")
    total = data.get("total")
    payment = data.get("payment", {})

    amount_paid = float(payment.get("amount", 0))
    payment_method = payment.get("method", "cash")
    mpesa_reference = payment.get("mpesa_reference")

    if not items or not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Items must be provided")

    if total is None:
        raise HTTPException(status_code=400, detail="Total is required")

    try:
        sale = create_sale(
            db,
            items,
            total,
            amount_paid,
            current_user.id
        )

        sale.payment_method = payment_method
        sale.mpesa_reference = mpesa_reference

        sale.receipt_number = f"RCPT-{int(time.time())}"
        sale.status = "paid" if amount_paid >= total else "pending"

        if hasattr(sale, "record_ledger_entries"):
            sale.record_ledger_entries(db)

        db.commit()
        db.refresh(sale)

        return build_receipt(sale, current_user)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# RECORD SALE (LEGACY - OPTIONAL)
# =========================
@router.post("/")
def record_sale(data: dict, db: Session = Depends(get_db)):
    items = data.get("items")
    total = data.get("total")
    amount_paid = float(data.get("amount_paid", 0))
    user_id = data.get("user_id")

    payment_method = data.get("payment_method", "cash")
    mpesa_reference = data.get("mpesa_reference")

    if not items or not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Items must be provided")

    if total is None:
        raise HTTPException(status_code=400, detail="Total is required")

    try:
        sale = create_sale(db, items, total, amount_paid, user_id)

        sale.payment_method = payment_method
        sale.mpesa_reference = mpesa_reference

        sale.receipt_number = f"RCPT-{int(time.time())}"
        sale.status = "paid" if amount_paid >= total else "pending"

        if hasattr(sale, "record_ledger_entries"):
            sale.record_ledger_entries(db)

        db.commit()
        db.refresh(sale)

        return build_receipt(sale)

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


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
# DAILY SALES REPORT
# =========================
@router.get("/reports/daily")
def sales_daily(range: str = "7d", db: Session = Depends(get_db)):
    now = datetime.now()

    if range == "today":
        start_date = now - timedelta(days=1)
    elif range == "7d":
        start_date = now - timedelta(days=7)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    sales = db.query(Sale).filter(Sale.created_at >= start_date).all()

    totals = {}

    for sale in sales:
        d = str(sale.created_at.date())
        totals[d] = totals.get(d, 0) + float(sale.total_amount)

    return [{"date": d, "total": t} for d, t in sorted(totals.items())]


# =========================
# TOP PRODUCTS
# =========================
@router.get("/reports/top-products")
def top_products(db: Session = Depends(get_db)):
    results = (
        db.query(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("qty")
        )
        .join(Sale)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
        .all()
    )

    return [{"product_id": r.product_id, "quantity": int(r.qty)} for r in results]


# =========================
# WORST PRODUCTS
# =========================
@router.get("/reports/worst-products")
def worst_products(db: Session = Depends(get_db)):
    results = (
        db.query(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("qty")
        )
        .join(Sale)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.quantity).asc())
        .limit(5)
        .all()
    )

    return [{"product_id": r.product_id, "quantity": int(r.qty)} for r in results]


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