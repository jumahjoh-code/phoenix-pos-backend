from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging
from datetime import datetime, date

from app.core.database import get_db
from app.services.payment_service import (
    create_payment,
    attach_checkout_request_id,
    mark_payment_success,
    mark_payment_failed
)
from app.services.mpesa import stk_push
from app.schemas.payment import STKPushRequest

from app.models.sale import Sale
from app.models.ledger import Ledger
from app.models.payment import Payment


router = APIRouter(prefix="/mpesa", tags=["M-Pesa"])
logger = logging.getLogger(__name__)


# =========================
# 📲 STK PUSH (SAFE)
# =========================
@router.post("/stk-push")
def initiate_stk_push(payload: STKPushRequest, db: Session = Depends(get_db)):

    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    try:
        logger.info(f"STK REQUEST: {payload.dict()}")

        # 🔒 Ensure sale exists
        sale = db.query(Sale).filter(Sale.id == payload.sale_id).first()
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")

        # 💳 Create payment
        payment = create_payment(db, payload.sale_id, payload.amount, "mpesa")

        # 📲 Send STK
        stk_response = stk_push(
            payload.phone,
            payload.amount,
            payload.sale_id
        )

        logger.info(f"STK RESPONSE: {stk_response}")

        if "error" in stk_response:
            raise HTTPException(status_code=500, detail="STK push failed")

        checkout_id = stk_response.get("CheckoutRequestID")

        if not checkout_id:
            raise HTTPException(status_code=500, detail="Missing CheckoutRequestID")

        attach_checkout_request_id(db, payment.id, checkout_id)

        return {
            "success": True,
            "checkout_request_id": checkout_id,
            "message": stk_response.get("CustomerMessage")
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"STK ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="STK push error")


# =========================
# 📥 CALLBACK (IDEMPOTENT)
# =========================
@router.post("/callback")
async def mpesa_callback(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        logger.info(f"M-Pesa Callback: {data}")

        stk_callback = data.get("Body", {}).get("stkCallback", {})

        result_code = stk_callback.get("ResultCode")
        checkout_request_id = stk_callback.get("CheckoutRequestID")

        if not checkout_request_id:
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # ❌ FAILED
        if result_code != 0:
            mark_payment_failed(db, checkout_request_id)
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # ✅ METADATA
        metadata_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        metadata = {item["Name"]: item.get("Value") for item in metadata_items}

        mpesa_code = metadata.get("MpesaReceiptNumber")
        amount = float(metadata.get("Amount", 0))

        if not mpesa_code:
            logger.warning("Missing M-Pesa code")
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # 🔒 IDEMPOTENCY (PRIMARY CHECK)
        existing_payment = db.query(Payment).filter(
            Payment.reference == mpesa_code
        ).first()

        if existing_payment:
            logger.warning(f"Duplicate callback ignored: {mpesa_code}")
            return {"ResultCode": 0, "ResultDesc": "Already processed"}

        # 🔥 MARK SUCCESS (handles ledger + sync)
        payment = mark_payment_success(db, checkout_request_id, mpesa_code)

        if not payment:
            logger.error("Payment not found")
            return {"ResultCode": 0, "ResultDesc": "Payment not found"}

        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    except Exception as e:
        logger.error(f"Callback Error: {str(e)}")
        return {"ResultCode": 0, "ResultDesc": "Accepted"}
        # ⚠️ Always return 200 to M-Pesa


# =========================
# 📊 RECONCILIATION (FIXED)
# =========================
@router.get("/reconciliation/today")
def mpesa_reconciliation_today(db: Session = Depends(get_db)):

    today = date.today()

    # Payments (source of truth)
    payments = db.query(Payment).filter(
        Payment.payment_method == "mpesa",
        Payment.status == "completed",
        func.date(Payment.created_at) == today
    ).all()

    payment_total = sum(p.amount for p in payments)

    # Ledger entries
    ledger_entries = db.query(Ledger).filter(
        Ledger.method == "mpesa",
        func.date(Ledger.created_at) == today
    ).all()

    ledger_total = sum(e.amount for e in ledger_entries)

    payment_refs = set(p.reference for p in payments if p.reference)
    ledger_refs = set(e.reference for e in ledger_entries if e.reference)

    return {
        "payment_total": payment_total,
        "ledger_total": ledger_total,
        "difference": payment_total - ledger_total,
        "matched": len(payment_refs & ledger_refs),
        "missing_in_ledger": list(payment_refs - ledger_refs),
        "missing_in_payments": list(ledger_refs - payment_refs),
        "status": "OK" if payment_total == ledger_total else "MISMATCH"
    }