from sqlalchemy import select
from fastapi import HTTPException
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


def create_sale(db, items, total, amount_paid, user_id=None):

    cost_total = 0
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

        quantity = float(item["quantity"])

        if quantity <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity")

        if product.stock_quantity < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"{product.name} out of stock"
            )

        prepared_items.append({
            "product": product,  # ✅ ALWAYS ORM object
            "quantity": quantity,
            "price": float(item.get("price", product.retail_price))
        })

        cost_total += product.cost_price * quantity

    # =========================
    # 🧾 CREATE SALE
    # =========================
    sale = Sale(
        total_amount=total,
        amount_paid=amount_paid,
        balance=total - amount_paid,
        cost_total=cost_total,
        profit=total - cost_total,
        user_id=user_id
    )

    db.add(sale)
    db.flush()

    # =========================
    # 📦 CREATE ITEMS
    # =========================
    for item in prepared_items:
        product = item["product"]

        # 🔥 DEFENSIVE CHECK
        if not hasattr(product, "id"):
            raise HTTPException(
                status_code=500,
                detail="Product object corrupted (not ORM instance)"
            )

        quantity = item["quantity"]

        product.stock_quantity -= quantity

        sale_item = SaleItem(
            product_id=product.id,
            quantity=quantity,
            price=item["price"],
            cost_price=product.cost_price
        )

        sale.items.append(sale_item)

    db.flush()

    return sale