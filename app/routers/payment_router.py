from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.payment import CashPaymentRequest
from app.services.payment_service import (
    mark_cash_payment,
    get_payments_by_sale,
    get_total_paid
)

router = APIRouter(prefix="/payments", tags=["Payments"])


# =========================
# 🔷 CASH PAYMENT
# =========================
@router.post("/cash")
def cash_payment(
    payload: CashPaymentRequest,
    db: Session = Depends(get_db)
):
    payment = mark_cash_payment(
        db,
        payload.sale_id,
        payload.amount
    )

    return {
        "message": "Cash payment recorded",
        "payment_id": payment.id
    }


# =========================
# 🔷 GET PAYMENTS FOR A SALE
# =========================
@router.get("/sale/{sale_id}")
def get_sale_payments(sale_id: int, db: Session = Depends(get_db)):
    payments = get_payments_by_sale(db, sale_id)

    return payments


# =========================
# 🔷 GET TOTAL PAID
# =========================
@router.get("/total/{sale_id}")
def get_total(sale_id: int, db: Session = Depends(get_db)):
    total_paid = get_total_paid(db, sale_id)

    return {
        "sale_id": sale_id,
        "total_paid": total_paid
    }