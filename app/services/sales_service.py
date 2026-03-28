from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


def create_sale(db, items, total, amount_paid, user_id=None):

    cost_total = 0

    # =========================
    # CREATE SALE
    # =========================
    sale = Sale(
        total_amount=total,
        amount_paid=amount_paid,
        balance=total - amount_paid,
        status="completed",
        user_id=user_id  # ✅ FIXED
    )

    db.add(sale)
    db.flush()

    # =========================
    # PROCESS ITEMS
    # =========================
    for item in items:
        product = db.query(Product).filter(Product.id == item["product_id"]).first()

        if not product:
            raise Exception("Product not found")

        quantity = item["quantity"]

        # ✅ STOCK CONTROL (IMPORTANT)
        if product.stock_quantity < quantity:
            raise Exception(f"{product.name} out of stock")

        # Reduce stock
        product.stock_quantity -= quantity

        item_total_cost = product.cost_price * quantity
        cost_total += item_total_cost

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=quantity,
            price=product.retail_price,
            cost_price=product.cost_price
        )

        db.add(sale_item)

    # =========================
    # UPDATE PROFIT BASE
    # =========================
    sale.cost_total = cost_total

    db.commit()
    db.refresh(sale)

    return sale