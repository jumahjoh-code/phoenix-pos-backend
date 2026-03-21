from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.sale import Sale


# 🔷 CREATE PAYMENT (USED BEFORE STK PUSH OR CASH)
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


# 🔥 INTERNAL: UPDATE SALE STATUS BASED ON PAYMENTS
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


# 🔷 MARK PAYMENT SUCCESS (FROM CALLBACK)
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

    # 🔥 UPDATE SALE STATUS PROPERLY
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


# 🔥 MARK CASH PAYMENT (INSTANT SUCCESS)
def mark_cash_payment(
    db: Session,
    sale_id: int,
    amount: float
):
    payment = create_payment(db, sale_id, amount, "cash")

    payment.status = "completed"

    # 🔥 UPDATE SALE STATUS
    update_sale_status(db, sale_id)

    db.commit()
    db.refresh(payment)

    return payment


# 🔷 GET PAYMENTS BY SALE (FOR RECEIPTS / UI)
def get_payments_by_sale(db: Session, sale_id: int):
    return db.query(Payment).filter(Payment.sale_id == sale_id).all()


# 🔷 TOTAL PAID FOR A SALE
def get_total_paid(db: Session, sale_id: int):
    payments = db.query(Payment).filter(
        Payment.sale_id == sale_id,
        Payment.status == "completed"
    ).all()

    return sum(p.amount for p in payments)