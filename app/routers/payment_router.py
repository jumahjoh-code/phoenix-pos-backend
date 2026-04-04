from fastapi import APIRouter, Depends, HTTPException
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
    try:
        payment = mark_cash_payment(
            db,
            payload.sale_id,
            payload.amount
        )

        return {
            "success": True,
            "message": "Cash payment recorded",
            "payment_id": payment.id
        }

    except ValueError as e:
        # business logic errors (e.g. insufficient cash, invalid sale)
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # unexpected server errors
        raise HTTPException(status_code=500, detail="Payment failed")


# =========================
# 🔷 GET PAYMENTS FOR A SALE
# =========================
@router.get("/sale/{sale_id}")
def get_sale_payments(
    sale_id: int,
    db: Session = Depends(get_db)
):
    try:
        payments = get_payments_by_sale(db, sale_id)

        return {
            "success": True,
            "sale_id": sale_id,
            "payments": payments
        }

    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch payments")


# =========================
# 🔷 GET TOTAL PAID
# =========================
@router.get("/total/{sale_id}")
def get_total(
    sale_id: int,
    db: Session = Depends(get_db)
):
    try:
        total_paid = get_total_paid(db, sale_id)

        return {
            "success": True,
            "sale_id": sale_id,
            "total_paid": total_paid
        }

    except Exception:
        raise HTTPException(status_code=500, detail="Failed to fetch total paid")