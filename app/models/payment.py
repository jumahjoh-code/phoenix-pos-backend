from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Numeric
from datetime import datetime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 LINK TO SALE
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)

    # 💳 PAYMENT METHOD
    # cash, mpesa, card
    payment_method = Column(String, nullable=False, index=True)

    # 💰 AMOUNT PAID (SAFE)
    amount = Column(Numeric(12, 2), nullable=False)

    # 📌 STATUS
    # pending, completed, failed
    status = Column(String, default="completed", nullable=False, index=True)

    # 🔗 OPTIONAL REFERENCES (MPESA / CARD)
    reference = Column(String, nullable=True, index=True)
    checkout_request_id = Column(String, nullable=True, index=True)

    # ⏱️ TIMESTAMP
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # =========================
    # 🔥 RELATIONSHIP (CRITICAL FIX)
    # =========================
    sale = relationship("Sale", back_populates="payments")