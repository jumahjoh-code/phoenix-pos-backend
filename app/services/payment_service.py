from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.ledger import Ledger


# =========================
# 🔷 CREATE PAYMENT (NO COMMIT)
# =========================
def create_payment(db: Session, sale_id: int, amount: float, method: str):
    if amount <= 0:
        raise ValueError("Invalid payment amount")

    payment = Payment(
        sale_id=sale_id,
        amount=float(amount),
        payment_method=method,
        status="pending"
    )

    db.add(payment)
    db.flush()

    return payment


# =========================
# 🔷 ATTACH CHECKOUT ID
# =========================
def attach_checkout_request_id(db: Session, payment_id: int, checkout_request_id: str):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        return None

    payment.checkout_request_id = checkout_request_id
    db.flush()

    return payment


# =========================
# 🔥 SYNC SALE FINANCIALS (IMPROVED)
# =========================
def sync_sale_financials(db: Session, sale_id: int):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        return None

    total_paid = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).scalar()

    total_paid = float(total_paid or 0)

    sale.amount_paid = total_paid
    sale.balance = float(sale.total_amount) - total_paid

    if sale.balance <= 0:
        sale.status = "paid"
    elif total_paid > 0:
        sale.status = "partial"
    else:
        sale.status = "pending"

    db.flush()

    return sale


# =========================
# 🔥 MARK CASH PAYMENT
# =========================
def mark_cash_payment(db: Session, sale_id: int, amount: float):
    if amount <= 0:
        raise ValueError("Invalid payment amount")

    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise ValueError("Sale not found")

    # 💳 Payment
    payment = Payment(
        sale_id=sale_id,
        amount=float(amount),
        payment_method="cash",
        status="completed"
    )

    db.add(payment)
    db.flush()

    # 📒 Ledger (idempotent safe: no duplicate check needed for cash)
    ledger_entry = Ledger(
        type="sale",
        amount=amount,
        method="cash",
        reference=None,
        description=f"Cash payment for sale #{sale_id}",
        sale_id=sale_id,
        payment_id=payment.id
    )

    db.add(ledger_entry)

    return payment


# =========================
# 🔥 MARK PAYMENT SUCCESS (MPESA) — HARDENED
# =========================
def mark_payment_success(db: Session, checkout_request_id: str, mpesa_code: str):
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id
    ).first()

    if not payment:
        return None

    # 🔒 IDEMPOTENCY CHECK (CRITICAL)
    if payment.status == "completed":
        return payment

    payment.status = "completed"
    payment.reference = mpesa_code

    # 📒 Prevent duplicate ledger entry
    existing = db.query(Ledger).filter(
        Ledger.payment_id == payment.id
    ).first()

    if not existing:
        ledger_entry = Ledger(
            type="sale",
            amount=payment.amount,
            method="mpesa",
            reference=mpesa_code,
            description=f"M-Pesa payment for sale #{payment.sale_id}",
            sale_id=payment.sale_id,
            payment_id=payment.id
        )
        db.add(ledger_entry)

    sync_sale_financials(db, payment.sale_id)

    db.commit()
    db.refresh(payment)

    return payment


# =========================
# 🔷 MARK PAYMENT FAILED
# =========================
def mark_payment_failed(db: Session, checkout_request_id: str):
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id
    ).first()

    if not payment:
        return None

    if payment.status == "completed":
        return payment  # do not downgrade

    payment.status = "failed"

    db.commit()
    db.refresh(payment)

    return payment


# =========================
# 🔷 GET PAYMENTS
# =========================
def get_payments_by_sale(db: Session, sale_id: int):
    return db.query(Payment).filter(Payment.sale_id == sale_id).all()


# =========================
# 🔷 TOTAL PAID (FAST)
# =========================
def get_total_paid(db: Session, sale_id: int):
    total = db.query(
        func.coalesce(func.sum(Payment.amount), 0)
    ).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).scalar()

    return float(total or 0)