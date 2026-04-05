from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.ledger import Ledger


# =========================
# 🔷 CREATE PAYMENT (NO COMMIT)
# =========================
def create_payment(
    db: Session,
    sale_id: int,
    amount: float,
    method: str
):
    payment = Payment(
        sale_id=sale_id,
        amount=amount,
        payment_method=method,
        status="pending"
    )

    db.add(payment)

    return payment


# =========================
# 🔷 ATTACH CHECKOUT ID (MPESA)
# =========================
def attach_checkout_request_id(
    db: Session,
    payment_id: int,
    checkout_request_id: str
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        return None

    payment.checkout_request_id = checkout_request_id

    db.commit()
    db.refresh(payment)

    return payment


# =========================
# 🔥 UPDATE SALE STATUS
# =========================
def update_sale_status(db: Session, sale_id: int):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()

    if not sale:
        return None

    payments = db.query(Payment).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).all()

    total_paid = sum(p.amount for p in payments)

    if total_paid <= 0:
        sale.status = "pending"
    elif total_paid < sale.total:
        sale.status = "partial"
    else:
        sale.status = "paid"

    return sale


# =========================
# 🔷 MARK PAYMENT SUCCESS (MPESA)
# =========================
def mark_payment_success(
    db: Session,
    checkout_request_id: str,
    mpesa_code: str
):
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id
    ).first()

    if not payment:
        return None

    payment.status = "completed"
    payment.reference = mpesa_code

    # 🔥 Ledger entry (FIXED)
    ledger_entry = Ledger(
        type="sale",
        amount=payment.amount,
        method="mpesa",
        reference=mpesa_code,
        description=f"M-Pesa payment for sale #{payment.sale_id}"
    )

    db.add(ledger_entry)

    # 🔥 Update sale
    update_sale_status(db, payment.sale_id)

    db.commit()
    db.refresh(payment)

    return payment


# =========================
# 🔷 MARK PAYMENT FAILED
# =========================
def mark_payment_failed(
    db: Session,
    checkout_request_id: str
):
    payment = db.query(Payment).filter(
        Payment.checkout_request_id == checkout_request_id
    ).first()

    if not payment:
        return None

    payment.status = "failed"

    db.commit()
    db.refresh(payment)

    return payment


# =========================
# 🔥 MARK CASH PAYMENT (FIXED & SAFE)
# =========================
def mark_cash_payment(
    db: Session,
    sale_id: int,
    amount: float
):
    try:
        # 🔍 Validate sale exists
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise ValueError("Sale not found")

        # 🔍 Validate amount
        if amount <= 0:
            raise ValueError("Invalid payment amount")

        # 💳 Create payment
        payment = Payment(
            sale_id=sale_id,
            amount=amount,
            payment_method="cash",
            status="completed"
        )

        db.add(payment)

        # 📒 Ledger entry (FIXED)
        ledger_entry = Ledger(
            type="sale",
            amount=amount,
            method="cash",
            reference=None,
            description=f"Cash payment for sale #{sale_id}"
        )

        db.add(ledger_entry)

        # 🔥 Update sale status (supports partial payments)
        update_sale_status(db, sale_id)

        # ✅ Commit transaction
        db.commit()
        db.refresh(payment)

        return payment

    except Exception as e:
        db.rollback()
        print("🔥 PAYMENT ERROR:", str(e))
        raise


# =========================
# 🔷 GET PAYMENTS
# =========================
def get_payments_by_sale(db: Session, sale_id: int):
    return db.query(Payment).filter(Payment.sale_id == sale_id).all()


# =========================
# 🔷 TOTAL PAID
# =========================
def get_total_paid(db: Session, sale_id: int):
    payments = db.query(Payment).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).all()

    return sum(p.amount for p in payments)