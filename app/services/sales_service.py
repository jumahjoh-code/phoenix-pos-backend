from fastapi import HTTPException
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.services.stock_service import apply_sale_stock


def create_sale(db, items, total, amount_paid, user_id=None, source="pos"):

    try:
        if not items:
            raise HTTPException(status_code=400, detail="No items provided")

        total_amount = 0
        cost_total = 0

        # 🔥 DETERMINE STATUS EARLY (IMPORTANT)
        is_paid = amount_paid >= total
        status = "paid" if is_paid else "pending"

        # =========================
        # CREATE SALE
        # =========================
        sale = Sale(
            total_amount=0,
            amount_paid=amount_paid,
            balance=0,
            status=status,
            user_id=user_id,
            source=source
        )

        db.add(sale)
        db.flush()

        # =========================
        # PROCESS ITEMS (NO STOCK YET)
        # =========================
        processed_items = []

        for item in items:

            product = db.query(Product).filter(Product.id == item["product_id"]).first()

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product not found: {item['product_id']}"
                )

            quantity = int(item["quantity"])

            if product.stock_quantity < quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"{product.name} out of stock"
                )

            # 🔥 USE CORRECT FIELD
            unit_price = float(getattr(product, "retail_price", 0))

            if unit_price <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid price for {product.name}"
                )

            cost_price = float(getattr(product, "cost_price", 0))

            line_total = unit_price * quantity
            total_amount += line_total
            cost_total += cost_price * quantity

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=product.id,
                quantity=quantity,
                price=unit_price,
                cost_price=cost_price,
                line_total=line_total
            )

            db.add(sale_item)

            # 🔥 STORE FOR LATER STOCK PROCESSING
            processed_items.append((product, quantity))

        # =========================
        # APPLY STOCK (CENTRALIZED)
        # =========================
        for product, quantity in processed_items:

            apply_sale_stock(
                db=db,
                product=product,
                quantity=quantity,
                source=source,
                status=status,
                reference=f"sale_{sale.id}"
            )

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