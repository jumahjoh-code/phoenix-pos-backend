print("🔥 SALES ROUTER EXECUTED 🔥")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from datetime import date, datetime, timedelta
import uuid

from app.core.database import get_db
from app.dependencies import get_current_user
from app.services.sales_service import create_sale
from app.services.payment_service import (
    mark_cash_payment,
    create_payment,
    sync_sale_financials
)
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User


router = APIRouter(prefix="/sales", tags=["Sales"])


# =========================
# 📅 DATE RANGE
# =========================
def get_start_date(range: str):
    now = datetime.now()

    if range == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "7d":
        return now - timedelta(days=7)
    elif range == "30d":
        return now - timedelta(days=30)

    return now - timedelta(days=7)


# =========================
# 🧾 RECEIPT BUILDER
# =========================
def build_receipt(sale, current_user=None):
    return {
        "sale_id": sale.id,
        "receipt_number": sale.receipt_number,
        "date": sale.created_at,
        "user": current_user.username if current_user else (
            sale.user.username if sale.user else None
        ),
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "Item",
                "quantity": item.quantity,
                "price": float(item.price),
                "total": float(item.quantity * item.price)
            }
            for item in sale.items
        ],
        "total_amount": float(sale.total_amount),
        "cost_total": float(sale.cost_total),
        "profit": float(sale.profit),
        "amount_paid": float(sale.amount_paid),
        "balance": float(sale.balance),
        "status": sale.status
    }


# =========================
# 🧾 RECEIPT NUMBER GENERATOR (IMPORTANT)
# =========================
def generate_receipt_number():
    now = datetime.now()
    return f"RCPT-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


# =========================
# 💰 COMPLETE SALE (HARDENED)
# =========================
@router.post("/complete")
def complete_sale(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = data.get("items")
    total = data.get("total")
    payments = data.get("payments", [])

    # 🔒 VALIDATION
    if not items or not isinstance(items, list):
        raise HTTPException(status_code=400, detail="Items must be provided")

    if total is None or float(total) <= 0:
        raise HTTPException(status_code=400, detail="Invalid total")

    try:
        # =========================
        # 🧾 CREATE SALE
        # =========================
        sale = create_sale(
            db=db,
            items=items,
            total=total,
            user_id=current_user.id
        )

        sale_id = sale.id

        # =========================
        # 💳 PAYMENTS
        # =========================
        total_paid = 0

        for p in payments:
            method = p.get("method")
            amount = float(p.get("amount", 0))

            if amount <= 0:
                continue

            total_paid += amount

            if method == "cash":
                mark_cash_payment(db=db, sale_id=sale_id, amount=amount)

            elif method == "mpesa":
                create_payment(
                    db=db,
                    sale_id=sale_id,
                    amount=amount,
                    method="mpesa"
                )

        # =========================
        # 🔒 PAYMENT VALIDATION (CRITICAL)
        # =========================
        if total_paid < float(total):
            raise HTTPException(status_code=400, detail="Insufficient payment")

        # =========================
        # 🔄 SYNC FINANCIALS
        # =========================
        sync_sale_financials(db, sale_id)

        # =========================
        # 🧾 RECEIPT NUMBER
        # =========================
        sale.receipt_number = generate_receipt_number()

        db.commit()

        # =========================
        # 🔁 RELOAD (SAFE)
        # =========================
        sale = db.query(Sale).options(
            joinedload(Sale.items).joinedload(SaleItem.product),
            joinedload(Sale.user)
        ).filter(Sale.id == sale_id).first()

        return build_receipt(sale, current_user)

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()
        print("🔥 FINAL ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


# =========================
# 📋 LIST SALES
# =========================
@router.get("/")
def list_sales(db: Session = Depends(get_db)):
    sales = db.query(Sale).order_by(Sale.id.desc()).limit(100).all()

    return [
        {
            "sale_id": sale.id,
            "date": sale.created_at,
            "user": sale.user.username if sale.user else None,
            "total_amount": float(sale.total_amount),
            "amount_paid": float(sale.amount_paid),
            "balance": float(sale.balance),
            "status": sale.status
        }
        for sale in sales
    ]


# =========================
# 🔍 GET SINGLE SALE
# =========================
@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).options(
        joinedload(Sale.items).joinedload(SaleItem.product),
        joinedload(Sale.user)
    ).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    return build_receipt(sale)


# =========================
# 📊 TODAY SUMMARY
# =========================
@router.get("/summary/today")
def today_summary(db: Session = Depends(get_db)):
    today = date.today()

    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())

    result = db.query(
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), 0),
        func.coalesce(func.sum(Sale.cost_total), 0),
        func.coalesce(func.sum(Sale.amount_paid), 0)
    ).filter(Sale.created_at.between(start, end)).first()

    transactions, total_sales, total_cost, cash_collected = result

    return {
        "transactions": int(transactions),
        "total_sales": float(total_sales),
        "total_cost": float(total_cost),
        "profit": float(total_sales - total_cost),
        "cash_collected": float(cash_collected)
    }


# =========================
# 📈 DAILY REPORT
# =========================
@router.get("/reports/daily")
def sales_daily(range: str = "7d", db: Session = Depends(get_db)):
    start_date = get_start_date(range)

    sales = db.query(Sale).filter(Sale.created_at >= start_date).all()

    totals = {}

    for sale in sales:
        d = str(sale.created_at.date())
        totals[d] = totals.get(d, 0) + float(sale.total_amount)

    return [{"date": d, "total": t} for d, t in sorted(totals.items())]


# =========================
# 👨‍💼 CASHIER PERFORMANCE
# =========================
@router.get("/reports/cashier-performance")
def cashier_performance(range: str = "today", db: Session = Depends(get_db)):
    start_date = get_start_date(range)

    results = db.query(
        User.username,
        func.count(Sale.id),
        func.coalesce(func.sum(Sale.total_amount), 0)
    ).join(User, Sale.user_id == User.id)\
     .filter(Sale.created_at >= start_date)\
     .group_by(User.username)\
     .all()

    data = [
        {
            "cashier": r[0],
            "transactions": int(r[1]),
            "total_sales": float(r[2])
        }
        for r in results
    ]

    return {
        "range": range,
        "data": data,
        "total_sales": sum(d["total_sales"] for d in data)
    }