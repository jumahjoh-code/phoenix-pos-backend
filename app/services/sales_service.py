from fastapi import HTTPException
import logging

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.stock_movement import StockMovement
from app.services.stock_service import deduct_stock, reserve_stock

logger = logging.getLogger(__name__)


def _audit_log(action: str, user_id=None, sale_id=None, reference=None, details=None):
    logger.info(
        "sales_audit action=%s user_id=%s sale_id=%s reference=%s details=%s",
        action,
        user_id,
        sale_id,
        reference,
        details or {},
    )


def _ensure_unique_mpesa_reference(db, mpesa_reference: str, current_sale_id: int | None = None):
    if not mpesa_reference:
        return

    query = db.query(Sale).filter(Sale.mpesa_reference == mpesa_reference, Sale.status == "paid")
    if current_sale_id is not None:
        query = query.filter(Sale.id != current_sale_id)

    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Duplicate payment reference already used on sale {existing.id}",
        )


def _resolve_sale_financials(payload):
    source = payload.source or "pos"

    if source == "pos":
        status = "paid"
        amount_paid = float(payload.total_amount)
    else:
        status = payload.status or "pending"
        amount_paid = float(payload.amount_paid or 0)

        if status == "paid":
            if amount_paid < float(payload.total_amount):
                raise HTTPException(status_code=400, detail="Paid ecommerce sale must cover total_amount")
            amount_paid = float(payload.total_amount)
        else:
            amount_paid = 0.0

    balance = max(float(payload.total_amount) - amount_paid, 0.0)
    return source, status, amount_paid, balance


def create_sale(db, payload):
    if not payload.items:
        raise HTTPException(status_code=400, detail="No items provided")

    if payload.offline_id:
        existing = db.query(Sale).filter(Sale.offline_id == payload.offline_id).first()
        if existing:
            _audit_log(
                action="sale_create_idempotent_hit",
                user_id=existing.user_id,
                sale_id=existing.id,
                reference=existing.offline_id,
            )
            return existing

    source, status, amount_paid, balance = _resolve_sale_financials(payload)
    if payload.payment_method == "mpesa" and status == "paid":
        _ensure_unique_mpesa_reference(db, payload.mpesa_reference)

    sale = Sale(
        total_amount=0,
        amount_paid=amount_paid,
        balance=balance,
        status=status,
        user_id=payload.user_id,
        customer_id=payload.customer_id,
        source=source,
        payment_method=payload.payment_method or "cash",
        mpesa_reference=payload.mpesa_reference,
        offline_id=payload.offline_id,
    )
    db.add(sale)
    db.flush()

    total_amount = 0.0
    cost_total = 0.0

    for item in payload.items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")

        quantity = int(item.quantity)
        unit_price = float(item.unit_price)
        line_total = float(unit_price * quantity)
        available_stock = int(getattr(product, "available_stock", product.stock_quantity))

        if available_stock < quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

        cost_price = float(product.cost_price or 0)
        total_amount += line_total
        cost_total += cost_price * quantity

        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=product.id,
            quantity=quantity,
            price=unit_price,
            cost_price=cost_price,
            line_total=line_total,
        )
        sale_item.sanitize()
        db.add(sale_item)

        if source == "ecommerce" and status == "pending":
            reserve_stock(db=db, product=product, quantity=quantity, reference=f"sale_{sale.id}")
            _audit_log(
                action="stock_reserved",
                user_id=payload.user_id,
                sale_id=sale.id,
                reference=f"sale_{sale.id}",
                details={"product_id": product.id, "quantity": quantity},
            )
        else:
            deduct_stock(db=db, product=product, quantity=quantity, reference=f"sale_{sale.id}")
            _audit_log(
                action="stock_deducted",
                user_id=payload.user_id,
                sale_id=sale.id,
                reference=f"sale_{sale.id}",
                details={"product_id": product.id, "quantity": quantity},
            )

    if abs(total_amount - float(payload.total_amount)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Total mismatch: payload {payload.total_amount} vs computed {round(total_amount, 2)}",
        )

    if sale.payment_method == "mpesa" and sale.status == "paid" and not sale.mpesa_reference:
        raise HTTPException(status_code=400, detail="mpesa_reference is required for paid M-Pesa sales")

    sale.total_amount = round(total_amount, 2)
    sale.cost_total = round(cost_total, 2)
    sale.amount_paid = round(amount_paid, 2)
    sale.balance = round(max(sale.total_amount - sale.amount_paid, 0), 2)

    _audit_log(
        action="sale_created",
        user_id=sale.user_id,
        sale_id=sale.id,
        reference=sale.receipt_number or f"sale_{sale.id}",
        details={
            "source": sale.source,
            "status": sale.status,
            "total_amount": sale.total_amount,
            "amount_paid": sale.amount_paid,
        },
    )

    return sale


def confirm_sale_payment(db, sale_id, payload):
    sale = db.query(Sale).filter(Sale.id == sale_id).with_for_update().first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    if sale.status == "paid":
        same_method = sale.payment_method == payload.method
        same_ref = (payload.mpesa_reference or None) == (sale.mpesa_reference or None)
        if same_method and (payload.method != "mpesa" or same_ref):
            _audit_log(
                action="payment_confirm_idempotent_hit",
                user_id=sale.user_id,
                sale_id=sale.id,
                reference=sale.mpesa_reference or f"sale_{sale.id}",
            )
            return sale, "Already paid"
        raise HTTPException(status_code=409, detail="Sale already paid with different payment details")

    if payload.amount < float(sale.total_amount or 0):
        raise HTTPException(status_code=400, detail="Payment amount is less than sale total")
    if payload.amount > float(sale.total_amount or 0):
        raise HTTPException(status_code=400, detail="Payment amount cannot exceed sale total")

    if payload.method == "mpesa":
        if not payload.mpesa_reference:
            raise HTTPException(status_code=400, detail="M-Pesa reference required")
        _ensure_unique_mpesa_reference(db, payload.mpesa_reference, current_sale_id=sale.id)

    if sale.source == "ecommerce" and sale.status == "pending":
        product_ids = [item.product_id for item in sale.items]
        products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids))
            .with_for_update()
            .all()
        )
        product_by_id = {p.id: p for p in products}

        for item in sale.items:
            product = product_by_id.get(item.product_id)
            if not product:
                raise HTTPException(status_code=404, detail=f"Product missing for sale item {item.id}")

            if int(product.reserved_stock or 0) < item.quantity:
                raise HTTPException(status_code=400, detail=f"Reserved stock mismatch for {product.name}")
            if int(product.stock_quantity or 0) < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")

            product.reserved_stock = max(int(product.reserved_stock or 0) - item.quantity, 0)
            product.stock_quantity -= item.quantity

            db.add(StockMovement(
                product_id=product.id,
                change=-item.quantity,
                movement_type="sale",
                reference=f"sale_{sale.id}",
                note="Deducted on payment confirmation",
            ))
            _audit_log(
                action="stock_deducted_on_confirmation",
                user_id=sale.user_id,
                sale_id=sale.id,
                reference=f"sale_{sale.id}",
                details={"product_id": product.id, "quantity": item.quantity},
            )

    sale.mark_as_paid(
        amount=payload.amount,
        method=payload.method,
        mpesa_ref=payload.mpesa_reference,
    )
    sale.record_ledger_entries(db)

    _audit_log(
        action="payment_confirmed",
        user_id=sale.user_id,
        sale_id=sale.id,
        reference=sale.mpesa_reference or f"sale_{sale.id}",
        details={"method": sale.payment_method, "amount_paid": sale.amount_paid},
    )
    return sale, "Payment confirmed"
