from fastapi import HTTPException
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product


def create_sale(db, items, total, amount_paid, user_id=None):

    try:
        if not items:
            raise HTTPException(status_code=400, detail="No items provided")

        total_amount = 0
        cost_total = 0

        # =========================
        # CREATE SALE (INITIAL)
        # =========================
        sale = Sale(
            total_amount=0,  # 🔥 recalculated
            amount_paid=amount_paid,
            balance=0,
            status="completed",
            user_id=user_id
        )

        db.add(sale)
        db.flush()

        # =========================
        # PROCESS ITEMS
        # =========================
        for item in items:

            product = db.query(Product).filter(Product.id == item["product_id"]).first()

            if not product:
                raise HTTPException(status_code=404, detail="Product not found")

            quantity = int(item["quantity"])

            # 🔥 STOCK CHECK
            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} out of stock"
                )

            # 🔥 SAFE PRICE RESOLUTION
            unit_price = (
                item.get("unit_price") or
                getattr(product, "price", None) or
                getattr(product, "retail_price", 0)
            )

            if not unit_price or unit_price <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid price for {product.name}"
                )

            # 🔥 CALCULATE TOTALS
            line_total = unit_price * quantity
            total_amount += line_total

            cost_price = float(getattr(product, "cost_price", 0))
            cost_total += cost_price * quantity

            # 🔥 CREATE SALE ITEM
            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                price=unit_price,
                cost_price=cost_price
            )

            db.add(sale_item)

            # 🔥 STOCK DEDUCTION
            product.stock_quantity -= quantity

        # =========================
        # FINALIZE SALE
        # =========================
        sale.total_amount = total_amount
        sale.cost_total = cost_total
        sale.balance = max(total_amount - amount_paid, 0)

        db.commit()
        db.refresh(sale)

        return sale

    except Exception as e:
        db.rollback()
        raise e