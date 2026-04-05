from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.core.database import Base


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 TYPE OF TRANSACTION
    # Standardized values:
    # sale, mpesa_deposit, mpesa_withdraw, expense
    type = Column(String, nullable=False, index=True)

    # 💰 AMOUNT
    amount = Column(Float, nullable=False)

    # 💳 PAYMENT METHOD
    # cash, mpesa, card
    method = Column(String, nullable=False, index=True)

    # 🔗 OPTIONAL REFERENCE (e.g. MPESA code)
    reference = Column(String, nullable=True, index=True)

    # 📝 DESCRIPTION (HUMAN READABLE - REQUIRED)
    description = Column(String, nullable=False)

    # ⏱️ TIMESTAMP
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)