from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.models.ledger import Ledger
from app.models.sale import Sale


def mark_cash_payment(db: Session, sale_id: int, amount: float):
    try:
        # 🔍 1. VALIDATE SALE EXISTS
        sale = db.query(Sale).filter(Sale.id == sale_id).first()
        if not sale:
            raise ValueError("Sale not found")

        # 🔍 2. VALIDATE AMOUNT
        if amount <= 0:
            raise ValueError("Invalid payment amount")

        # 💳 3. CREATE PAYMENT
        payment = Payment(
            sale_id=sale_id,
            payment_method="cash",
            amount=amount,
            status="completed"
        )

        db.add(payment)

        # 📒 4. CREATE LEDGER ENTRY (CRITICAL FIX HERE)
        ledger = Ledger(
            type="sale",
            amount=amount,
            method="cash",
            reference=None,
            description=f"Cash payment for sale {sale_id}"
        )

        db.add(ledger)

        # 💾 5. COMMIT TRANSACTION
        db.commit()

        # 🔄 6. REFRESH PAYMENT
        db.refresh(payment)

        return payment

    except Exception as e:
        db.rollback()
        print("🔥 PAYMENT ERROR:", str(e))  # IMPORTANT FOR DEBUGGING
        raise