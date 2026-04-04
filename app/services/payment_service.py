from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.sale import Sale
from app.models.ledger import Ledger


# 🔷 CREATE PAYMENT
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
    db.commit()
    db.refresh(payment)

    return payment


# 🔷 ATTACH CHECKOUT ID AFTER STK PUSH
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


# 🔥 UPDATE SALE STATUS
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


# 🔷 MARK PAYMENT SUCCESS (MPESA)
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

    # 🔥 ALSO RECORD IN LEDGER
    ledger_entry = Ledger(
        type="in",
        amount=payment.amount,
        reason=f"M-Pesa payment for sale #{payment.sale_id}"
    )

    db.add(ledger_entry)

    update_sale_status(db, payment.sale_id)

    db.commit()
    db.refresh(payment)

    return payment


# 🔷 MARK PAYMENT FAILED
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


# 🔥 MARK CASH PAYMENT (FIXED)
def mark_cash_payment(
    db: Session,
    sale_id: int,
    amount: float
):
    payment = create_payment(db, sale_id, amount, "cash")

    payment.status = "completed"

    # ✅ FIX: ADD CASH TO LEDGER
    ledger_entry = Ledger(
        type="in",  # 🔥 THIS WAS MISSING
        amount=amount,
        reason=f"Cash sale #{sale_id}"
    )

    db.add(ledger_entry)

    # 🔥 UPDATE SALE STATUS
    update_sale_status(db, sale_id)

    db.commit()
    db.refresh(payment)

    return payment


# 🔷 GET PAYMENTS
def get_payments_by_sale(db: Session, sale_id: int):
    return db.query(Payment).filter(Payment.sale_id == sale_id).all()


# 🔷 TOTAL PAID
def get_total_paid(db: Session, sale_id: int):
    payments = db.query(Payment).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).all()

    return sum(p.amount for p in payments)