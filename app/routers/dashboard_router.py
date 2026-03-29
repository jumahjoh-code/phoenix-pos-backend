from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.inventory import Inventory


router = APIRouter(
    prefix="/ai",
    tags=["Dashboard"]
)


# =========================
# DASHBOARD SUMMARY
# =========================
@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db)):

    total_sales = db.query(func.sum(Sale.total_amount)).scalar() or 0
    total_transactions = db.query(func.count(Sale.id)).scalar() or 0
    low_stock_items = db.query(Inventory).filter(Inventory.quantity < 10).count()

    return {
        "total_sales": float(total_sales),
        "transactions": total_transactions,
        "low_stock": low_stock_items
    }


# =========================
# RECENT SALES
# =========================
@router.get("/recent-sales")
def recent_sales(db: Session = Depends(get_db)):

    sales = (
        db.query(Sale)
        .order_by(Sale.id.desc())
        .limit(5)
        .all()
    )

    return [
        {
            "id": sale.id,
            "total": float(sale.total_amount),
            "date": str(sale.created_at) if hasattr(sale, "created_at") else "N/A"
        }
        for sale in sales
    ]


# =========================
# LOW STOCK
# =========================
@router.get("/low-stock")
def low_stock_products(db: Session = Depends(get_db)):

    items = (
        db.query(Inventory)
        .filter(Inventory.quantity < 10)
        .all()
    )

    return [
        {
            "product_id": item.product_id,
            "quantity": item.quantity
        }
        for item in items
    ]


# =========================
# SALES ANALYTICS (DAILY)
# =========================
@router.get("/reports/daily")
def sales_analytics(range: str = "7d", db: Session = Depends(get_db)):

    now = datetime.now()

    if range == "1d":
        start_date = now - timedelta(days=1)
    elif range == "7d":
        start_date = now - timedelta(days=7)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    sales = (
        db.query(Sale)
        .filter(Sale.created_at >= start_date)
        .all()
    )

    daily_totals = {}

    for sale in sales:
        date = str(sale.created_at.date())

        if date not in daily_totals:
            daily_totals[date] = 0

        daily_totals[date] += float(sale.total_amount)

    return [
        {"date": date, "total": total}
        for date, total in sorted(daily_totals.items())
    ]


# =========================
# PROFIT ANALYTICS
# =========================
@router.get("/reports/profit")
def profit_analytics(range: str = "7d", db: Session = Depends(get_db)):

    now = datetime.now()

    if range == "1d":
        start_date = now - timedelta(days=1)
    elif range == "7d":
        start_date = now - timedelta(days=7)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    sales = (
        db.query(Sale)
        .filter(Sale.created_at >= start_date)
        .all()
    )

    daily_profit = {}

    for sale in sales:
        date = str(sale.created_at.date())
        profit = 0

        for item in sale.items:
            cost = item.cost_price * item.quantity
            revenue = item.price * item.quantity
            profit += (revenue - cost)

        if date not in daily_profit:
            daily_profit[date] = 0

        daily_profit[date] += profit

    return [
        {"date": date, "profit": total}
        for date, total in sorted(daily_profit.items())
    ]


# =========================
# TOP PRODUCTS
# =========================
@router.get("/reports/top-products")
def top_products(range: str = "7d", db: Session = Depends(get_db)):

    now = datetime.now()

    if range == "1d":
        start_date = now - timedelta(days=1)
    elif range == "7d":
        start_date = now - timedelta(days=7)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    results = (
        db.query(
            SaleItem.product_id,
            func.sum(SaleItem.quantity).label("total_qty"),
            func.sum(SaleItem.quantity * SaleItem.price).label("revenue")
        )
        .join(Sale)
        .filter(Sale.created_at >= start_date)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "product_id": r.product_id,
            "quantity": int(r.total_qty),
            "revenue": float(r.revenue)
        }
        for r in results
    ]


# =========================
# TOP PROFIT PRODUCTS
# =========================
@router.get("/reports/top-profit-products")
def top_profit_products(range: str = "7d", db: Session = Depends(get_db)):

    now = datetime.now()

    if range == "1d":
        start_date = now - timedelta(days=1)
    elif range == "7d":
        start_date = now - timedelta(days=7)
    elif range == "30d":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)

    results = (
        db.query(
            SaleItem.product_id,
            func.sum(
                (SaleItem.price - SaleItem.cost_price) * SaleItem.quantity
            ).label("profit")
        )
        .join(Sale)
        .filter(Sale.created_at >= start_date)
        .group_by(SaleItem.product_id)
        .order_by(func.sum(
            (SaleItem.price - SaleItem.cost_price) * SaleItem.quantity
        ).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "product_id": r.product_id,
            "profit": float(r.profit)
        }
        for r in results
    ]


# =========================
# DEAD STOCK
# =========================
@router.get("/reports/dead-stock")
def dead_stock(db: Session = Depends(get_db)):

    now = datetime.now()
    start_date = now - timedelta(days=30)

    active_products = (
        db.query(SaleItem.product_id)
        .join(Sale)
        .filter(Sale.created_at >= start_date)
        .distinct()
        .all()
    )

    active_ids = [p.product_id for p in active_products]

    dead_items = (
        db.query(Inventory)
        .filter(~Inventory.product_id.in_(active_ids))
        .all()
    )

    return [
        {
            "product_id": item.product_id,
            "quantity": item.quantity
        }
        for item in dead_items
    ]


# =========================
# INVENTORY VALUE
# =========================
@router.get("/reports/inventory-value")
def inventory_value(db: Session = Depends(get_db)):

    total_value = 0
    items = db.query(Inventory).all()

    for item in items:
        cost = item.cost_price if hasattr(item, "cost_price") else 0
        total_value += cost * item.quantity

    return {
        "total_inventory_value": float(total_value)
    }
