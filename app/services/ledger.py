from sqlalchemy.orm import Session
from models.ledger import LedgerEntry


def create_ledger_entry(db: Session, amount: float, reference: str, source: str):
    entry = LedgerEntry(
        entry_type="income",
        amount=amount,
        reference=reference,
        source=source
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry