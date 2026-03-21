from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.core.database import get_db
from app.models.ledger import Ledger

router = APIRouter(prefix="/ledger", tags=["Ledger"])


# =========================
# 🔥 CREATE GENERIC ENTRY
# =========================
@router.post("/")
def create_entry(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))

    entry = Ledger(
        type=data.get("type"),
        amount=amount,
        method=data.get("method"),
        reference=data.get("reference"),
        description=data.get("description"),
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return {"message": "Ledger entry created", "id": entry.id}


# =========================
# 🧾 SALES → AUTO LEDGER
# =========================
@router.post("/sale")
def record_sale(data: dict, db: Session = Depends(get_db)):

    total = float(data.get("total", 0))
    method = data.get("method", "cash")
    reference = data.get("reference")

    if total <= 0:
        return {"error": "Invalid sale amount"}

    entry = Ledger(
        type="sale",
        amount=total,
        method=method,
        reference=reference,
        description="POS sale",
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()

    return {"message": "Sale recorded in ledger"}


# =========================
# 💸 EXPENSE FROM PETTY CASH
# =========================
@router.post("/expense")
def record_expense(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))
    description = data.get("description")
    category = data.get("category", "general")

    if amount <= 0:
        return {"error": "Invalid amount"}

    entry = Ledger(
        type="expense",
        amount=-amount,
        method="petty_cash",  # 🔥 important
        description=f"{category}: {description}",
        created_at=datetime.utcnow(),
    )

    db.add(entry)
    db.commit()

    return {"message": "Expense recorded (petty cash)"}


# =========================
# 💰 FUND PETTY CASH
# =========================
@router.post("/petty-cash/fund")
def fund_petty_cash(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))

    if amount <= 0:
        return {"error": "Invalid amount"}

    db.add_all([
        Ledger(
            type="petty_cash_fund",
            amount=-amount,
            method="cash",
            description="Transfer to petty cash",
            created_at=datetime.utcnow(),
        ),
        Ledger(
            type="petty_cash_fund",
            amount=amount,
            method="petty_cash",
            description="Petty cash funded",
            created_at=datetime.utcnow(),
        )
    ])

    db.commit()

    return {"message": "Petty cash funded"}


# =========================
# 💰 PETTY CASH BALANCE
# =========================
@router.get("/petty-cash")
def petty_cash_balance(db: Session = Depends(get_db)):

    entries = db.query(Ledger)\
        .filter(Ledger.method == "petty_cash")\
        .order_by(Ledger.created_at.asc())\
        .all()

    balance = 0
    history = []

    for e in entries:
        balance += e.amount

        history.append({
            "type": e.type,
            "amount": e.amount,
            "description": e.description,
            "balance": balance,
            "created_at": e.created_at
        })

    return {
        "balance": balance,
        "history": list(reversed(history))
    }


# =========================
# 🔥 M-PESA AGENT TRANSACTIONS
# =========================
@router.post("/agent")
def mpesa_agent(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))
    phone = data.get("phone")
    tx_type = data.get("type")

    if amount <= 0:
        return {"error": "Invalid amount"}

    if tx_type == "deposit":
        db.add_all([
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
        ])

    elif tx_type == "withdraw":
        db.add_all([
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
        ])

    else:
        return {"error": "Invalid transaction type"}

    db.commit()
    return {"message": "M-Pesa agent transaction recorded"}


# =========================
# 💵 CASH CONTROL
# =========================
@router.post("/cash")
def cash_control(data: dict, db: Session = Depends(get_db)):

    amount = float(data.get("amount", 0))
    tx_type = data.get("type")
    reason = data.get("reason") or "Manual entry"

    if amount <= 0:
        return {"error": "Invalid amount"}

    if tx_type == "in":
        entry = Ledger(
            type="cash_in",
            amount=amount,
            method="cash",
            description=reason,
            created_at=datetime.utcnow(),
        )

    elif tx_type == "out":
        entry = Ledger(
            type="cash_out",
            amount=-amount,
            method="cash",
            description=reason,
            created_at=datetime.utcnow(),
        )

    else:
        return {"error": "Invalid type"}

    db.add(entry)
    db.commit()

    return {"message": "Cash transaction recorded"}


# =========================
# 💰 CASH BALANCE + HISTORY
# =========================
@router.get("/cash")
def get_cash_data(db: Session = Depends(get_db)):

    entries = db.query(Ledger)\
        .filter(Ledger.method == "cash")\
        .order_by(Ledger.created_at.asc())\
        .all()

    balance = 0
    history = []

    for e in entries:
        balance += e.amount

        history.append({
            "type": "in" if e.amount > 0 else "out",
            "amount": abs(e.amount),
            "reason": e.description,
            "balance": balance,
            "created_at": e.created_at
        })

    return {
        "balance": balance,
        "history": list(reversed(history))
    }


# =========================
# 📊 PROFIT & LOSS
# =========================
@router.get("/reports/profit-loss")
def profit_loss(db: Session = Depends(get_db)):

    entries = db.query(Ledger).all()

    income = 0
    expenses = 0

    for e in entries:
        if e.type == "sale":
            income += e.amount
        elif e.type == "expense":
            expenses += abs(e.amount)

    return {
        "income": income,
        "expenses": expenses,
        "net_profit": income - expenses
    }


# =========================
# 📅 MONTHLY REPORT
# =========================
@router.get("/reports/monthly")
def monthly_report(db: Session = Depends(get_db)):

    results = db.query(
        func.strftime("%Y-%m", Ledger.created_at),
        func.sum(Ledger.amount)
    ).group_by(
        func.strftime("%Y-%m", Ledger.created_at)
    ).all()

    return [
        {
            "month": r[0],
            "net": float(r[1] or 0)
        }
        for r in results
    ]


# =========================
# 📊 FULL SUMMARY (UPDATED)
# =========================
@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):

    entries = db.query(Ledger).all()

    cash = 0
    mpesa_business = 0
    mpesa_agent = 0
    petty_cash = 0

    for e in entries:
        if e.method == "cash":
            cash += e.amount
        elif e.method == "mpesa_business":
            mpesa_business += e.amount
        elif e.method == "mpesa_agent":
            mpesa_agent += e.amount
        elif e.method == "petty_cash":
            petty_cash += e.amount

    return {
        "cash_balance": cash,
        "mpesa_business_balance": mpesa_business,
        "mpesa_agent_balance": mpesa_agent,
        "petty_cash_balance": petty_cash,
        "total_balance": cash + mpesa_business + mpesa_agent + petty_cash,
        "total_entries": len(entries)
    }


# =========================
# 📜 ALL TRANSACTIONS
# =========================
@router.get("/")
def get_all(db: Session = Depends(get_db)):
    return db.query(Ledger).order_by(Ledger.created_at.desc()).all()