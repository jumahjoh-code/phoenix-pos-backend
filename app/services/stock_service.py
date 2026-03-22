from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import StockMovement


# =========================
# 🔥 VALIDATE STOCK
# =========================
def validate_stock(product: Product, quantity: int):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity")

    if product.stock_quantity < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {product.name}"
        )


# =========================
# 🔥 LOG MOVEMENT
# =========================
def log_movement(db: Session, product: Product, change: int, movement_type: str, reference: str = None, note: str = None):
    movement = StockMovement(
        product_id=product.id,
        change=change,
        movement_type=movement_type,
        reference=reference,
        note=note
    )
    db.add(movement)


# =========================
# 🔥 DEDUCT STOCK (POS / PAID)
# =========================
def deduct_stock(db: Session, product: Product, quantity: int, reference: str = None):
    validate_stock(product, quantity)

    product.stock_quantity -= quantity

    log_movement(
        db=db,
        product=product,
        change=-quantity,
        movement_type="sale",
        reference=reference
    )


# =========================
# 🔥 RESTORE STOCK (CANCEL / REFUND)
# =========================
def restore_stock(db: Session, product: Product, quantity: int, reference: str = None):
    if quantity <= 0:
        return

    product.stock_quantity += quantity

    log_movement(
        db=db,
        product=product,
        change=quantity,
        movement_type="refund",
        reference=reference
    )


# =========================
# 🔥 RESERVE STOCK (ECOMMERCE)
# =========================
def reserve_stock(db: Session, product: Product, quantity: int, reference: str = None):
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Invalid quantity")

    available = product.stock_quantity - getattr(product, "reserved_stock", 0)

    if available < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Not enough stock to reserve for {product.name}"
        )

    product.reserved_stock += quantity

    log_movement(
        db=db,
        product=product,
        change=-quantity,
        movement_type="reserve",
        reference=reference
    )


# =========================
# 🔥 RELEASE RESERVED STOCK
# =========================
def release_reserved_stock(db: Session, product: Product, quantity: int, reference: str = None):
    if quantity <= 0:
        return

    current_reserved = getattr(product, "reserved_stock", 0)

    product.reserved_stock = max(current_reserved - quantity, 0)

    log_movement(
        db=db,
        product=product,
        change=quantity,
        movement_type="release",
        reference=reference
    )


# =========================
# 🔥 APPLY SALE STOCK LOGIC
# =========================
def apply_sale_stock(db: Session, product: Product, quantity: int, source: str, status: str, reference: str = None):
    """
    Central brain for stock behavior
    """

    if source == "pos":
        deduct_stock(db, product, quantity, reference)

    elif source == "ecommerce":

        if status == "paid":
            deduct_stock(db, product, quantity, reference)

        elif status == "pending":
            if hasattr(product, "reserved_stock"):
                reserve_stock(db, product, quantity, reference)

        elif status == "cancelled":
            restore_stock(db, product, quantity, reference)


# =========================
# 🔥 REVERSE SALE (CANCEL)
# =========================
def reverse_sale_items(db: Session, sale):
    """
    Restore stock for all items in a sale
    """

    for item in sale.items:
        product = item.product
        if product:
            restore_stock(
                db=db,
                product=product,
                quantity=item.quantity,
                reference=f"sale_{sale.id}"
            )