print("🔥 SALES SERVICE LOADED 🔥")

from sqlalchemy import select
from fastapi import HTTPException
from decimal import Decimal

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


def create_sale(db, items, user_id=None, customer_id=None):

    total_amount = Decimal("0")
    cost_total = Decimal("0")
    prepared_items = []

    # =========================
    # 🔒 LOCK + VALIDATE STOCK
    # =========================
    for item in items:
        product = db.execute(
            select(Product)
            .where(Product.id == item["product_id"])
            .with_for_update()
        ).scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        quantity = Decimal(str(item["quantity"]))

        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity")

        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} out of stock"
            )

        price = Decimal(str(item.get("price", product.retail_price or 0)))

        line_total = quantity * price

        total_amount += line_total
        cost_total += Decimal(str(product.cost_price or 0)) * quantity

        prepared_items.append({
            "product": product,
            "quantity": quantity,
            "price": price
        })

    # =========================
    # 🧾 CREATE SALE
    # =========================
    sale = Sale(
        customer_id=customer_id,
        user_id=user_id,
        total_amount=total_amount,
        cost_total=cost_total,
        amount_paid=Decimal("0"),
        balance=total_amount,
        status="pending"
    )

    db.add(sale)
    db.flush()

    # =========================
    # 📦 CREATE ITEMS + REDUCE STOCK
    # =========================
    for item in prepared_items:
        product = item["product"]
        quantity = item["quantity"]

        product.stock_quantity -= quantity

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=quantity,
            price=item["price"],
            cost_price=product.cost_price
        )

        db.add(sale_item)

    db.flush()

    return sale