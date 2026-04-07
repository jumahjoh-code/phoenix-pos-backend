from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.models.ledger import Ledger
from app.dependencies import require_admin


router = APIRouter(prefix="/ledger", tags=["Ledger"])


# =========================
# 🔥 CREATE GENERIC ENTRY (SAFE)
# =========================
@router.post("/")
def create_entry(data: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):

    amount = float(data.get("amount", 0))
    tx_type = data.get("type")
    method = data.get("method")
    description = data.get("description")

    if not tx_type or not method or not description:
        raise HTTPException(status_code=400, detail="Missing required fields")

    if amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    entry = Ledger(
        type=tx_type,
        amount=amount,
        method=method,
        reference=data.get("reference"),
        description=description,
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Ledger entry created", "id": entry.id}


# =========================
# 🧾 SALES → LEDGER (RESTRICTED)
# =========================
@router.post("/sale")
def record_sale(data: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):

    total = float(data.get("total", 0))

    if total <= 0:
        raise HTTPException(status_code=400, detail="Invalid sale amount")

    entry = Ledger(
        type="sale",
        amount=total,
        method=data.get("method", "cash"),
        reference=data.get("reference"),
        description="POS sale",
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()

    return {"message": "Sale recorded in ledger"}


# =========================
# 🔥 M-PESA AGENT (DOUBLE ENTRY)
# =========================
@router.post("/agent")
def mpesa_agent(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))
    phone = data.get("phone")
    tx_type = data.get("type")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    if tx_type not in ["deposit", "withdraw"]:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    entries = []

    if tx_type == "deposit":
        # Cash in, float out
        entries = [
            Ledger(
                type="mpesa_deposit",
                amount=amount,
                method="cash",
                description=f"Cash received from {phone}",
                created_at=datetime.utcnow(),
            ),
            Ledger(
                type="mpesa_deposit",
                amount=-amount,
                method="mpesa_agent",
                description=f"Float sent to {phone}",
                created_at=datetime.utcnow(),
            )
        ]

    elif tx_type == "withdraw":
        # Cash out, float in
        entries = [
            Ledger(
                type="mpesa_withdraw",
                amount=-amount,
                method="cash",
                description=f"Cash given to {phone}",
                created_at=datetime.utcnow(),
            ),
            Ledger(
                type="mpesa_withdraw",
                amount=amount,
                method="mpesa_agent",
                description=f"Float received from {phone}",
                created_at=datetime.utcnow(),
            )
        ]

    db.add_all(entries)
    db.commit()

    return {"message": "M-Pesa agent transaction recorded"}


# =========================
# 💵 CASH CONTROL (STRICT)
# =========================
@router.post("/cash")
def cash_control(data: dict, db: Session = Depends(get_db), admin=Depends(require_admin)):

    amount = float(data.get("amount", 0))
    tx_type = data.get("type")
    reason = data.get("reason") or "Manual entry"

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    if tx_type not in ["in", "out"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    entry = Ledger(
        type="cash_in" if tx_type == "in" else "cash_out",
        amount=amount if tx_type == "in" else -amount,
        method="cash",
        description=reason,
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()

    return {"message": "Cash transaction recorded"}


# =========================
# 💰 CASH BALANCE (FAST)
# =========================
@router.get("/cash")
def get_cash_data(db: Session = Depends(get_db)):

    entries = db.query(Ledger)\
        .filter(Ledger.method == "cash")\
        .order_by(Ledger.created_at.desc())\
        .limit(200)\
        .all()

    balance = sum(e.amount for e in entries)

    return {
        "balance": balance,
        "entries": [
            {
                "type": "in" if e.amount > 0 else "out",
                "amount": abs(e.amount),
                "reason": e.description,
                "created_at": e.created_at
            }
            for e in entries
        ]
    }


# =========================
# 📊 SUMMARY (OPTIMIZED)
# =========================
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):

    entries = db.query(Ledger).all()

    cash = sum(e.amount for e in entries if e.method == "cash")
    mpesa_business = sum(e.amount for e in entries if e.method == "mpesa_business")
    mpesa_agent = sum(e.amount for e in entries if e.method == "mpesa_agent")

    return {
        "cash_balance": cash,
        "mpesa_business_balance": mpesa_business,
        "mpesa_agent_balance": mpesa_agent,
        "total_balance": cash + mpesa_business + mpesa_agent,
        "total_entries": len(entries)
    }


# =========================
# 📜 ALL TRANSACTIONS (LIMITED)
# =========================
@router.get("/")
def get_all(db: Session = Depends(get_db)):

    return db.query(Ledger)\
        .order_by(Ledger.created_at.desc())\
        .limit(200)\
        .all()