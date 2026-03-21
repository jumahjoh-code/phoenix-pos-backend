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
# 🚀 STK PUSH
# =========================
@router.post("/stk-push")
def initiate_stk_push(
    payload: STKPushRequest,
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"STK REQUEST: {payload.dict()}")

        # 🔥 CREATE PAYMENT RECORD
        payment = create_payment(
            db,
            payload.sale_id,
            payload.amount,
            "mpesa"
        )

        # 🔥 SEND STK PUSH
        stk_response = stk_push(
            payload.phone,
            payload.amount,
            payload.sale_id
        )

        logger.info(f"STK RESPONSE: {stk_response}")

        if "error" in stk_response:
            return {
                "success": False,
                "message": "STK push failed",
                "details": stk_response.get("details")
            }

        checkout_id = stk_response.get("CheckoutRequestID")

        if not checkout_id:
            return {
                "success": False,
                "message": "No CheckoutRequestID returned",
                "response": stk_response
            }

        # 🔥 LINK PAYMENT → CHECKOUT ID
        attach_checkout_request_id(db, payment.id, checkout_id)

        return {
            "success": True,
            "message": "STK push sent",
            "checkout_request_id": checkout_id,
            "customer_message": stk_response.get("CustomerMessage")
        }

    except Exception as e:
        logger.error(f"STK ERROR: {str(e)}")

        return {
            "success": False,
            "message": "STK push error",
            "error": str(e)
        }


# =========================
# 📲 CALLBACK (CORE LOGIC)
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

        # =========================
        # ❌ FAILED PAYMENT
        # =========================
        if result_code != 0:
            mark_payment_failed(db, checkout_request_id)
            return {"ResultCode": 0, "ResultDesc": "Accepted"}

        # =========================
        # ✅ EXTRACT METADATA
        # =========================
        metadata_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
        metadata = {item["Name"]: item.get("Value") for item in metadata_items}

        mpesa_code = metadata.get("MpesaReceiptNumber")
        amount = float(metadata.get("Amount", 0))

        # =========================
        # 🔥 DUPLICATE PROTECTION
        # =========================
        existing_ledger = db.query(Ledger).filter(
            Ledger.reference == mpesa_code
        ).first()

        if existing_ledger:
            logger.warning(f"Duplicate callback ignored: {mpesa_code}")
            return {"ResultCode": 0, "ResultDesc": "Already processed"}

        # =========================
        # 🔥 MARK PAYMENT SUCCESS
        # =========================
        payment = mark_payment_success(db, checkout_request_id, mpesa_code)

        if not payment:
            logger.error("Payment not found")
            return {"ResultCode": 0, "ResultDesc": "Payment not found"}

        # =========================
        # 🔥 UPDATE SALE
        # =========================
        sale = db.query(Sale).filter(Sale.id == payment.sale_id).first()

        if sale:
            sale.amount_paid = (sale.amount_paid or 0) + amount
            sale.mpesa_reference = mpesa_code

            if sale.amount_paid >= sale.total_amount:
                sale.status = "completed"
            else:
                sale.status = "partial"

        # =========================
        # 🔥 CREATE LEDGER ENTRY
        # =========================
        ledger_entry = Ledger(
            type="sale",
            amount=amount,
            method="mpesa_business",
            reference=mpesa_code,
            description=f"M-Pesa STK sale #{sale.id if sale else 'N/A'}",
            created_at=datetime.utcnow(),
        )

        db.add(ledger_entry)

        # =========================
        # 💾 SAVE
        # =========================
        db.commit()

        logger.info(f"✅ Payment processed: {mpesa_code}")

        return {"ResultCode": 0, "ResultDesc": "Accepted"}

    except Exception as e:
        logger.error(f"Callback Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Callback failed")


# =========================
# 📊 RECONCILIATION (TODAY)
# =========================
@router.get("/reconciliation/today")
def mpesa_reconciliation_today(db: Session = Depends(get_db)):

    today = date.today()

    # Ledger entries
    ledger_entries = db.query(Ledger).filter(
        Ledger.method == "mpesa_business",
        func.date(Ledger.created_at) == today
    ).all()

    ledger_total = sum(e.amount for e in ledger_entries)

    # Payments
    payments = db.query(Payment).filter(
        Payment.method == "mpesa",
        Payment.status == "completed",
        func.date(Payment.created_at) == today
    ).all()

    payment_total = sum(p.amount for p in payments)

    ledger_refs = set(e.reference for e in ledger_entries if e.reference)
    payment_refs = set(p.mpesa_code for p in payments if p.mpesa_code)

    return {
        "ledger_total": ledger_total,
        "payment_total": payment_total,
        "difference": payment_total - ledger_total,
        "matched_transactions": len(ledger_refs & payment_refs),
        "missing_in_ledger": list(payment_refs - ledger_refs),
        "missing_in_payments": list(ledger_refs - payment_refs),
        "status": "OK" if payment_total == ledger_total else "MISMATCH"
    }