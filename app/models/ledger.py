from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)

    # =========================
    # 🔥 TRANSACTION TYPE
    # =========================
    # sale, mpesa_deposit, mpesa_withdraw, expense
    type = Column(String, nullable=False, index=True)

    # =========================
    # 💰 AMOUNT
    # =========================
    amount = Column(Float, nullable=False)

    # =========================
    # 💳 METHOD
    # =========================
    # cash, mpesa, card
    method = Column(String, nullable=False, index=True)

    # =========================
    # 🔗 REFERENCE (MPESA CODE ETC)
    # =========================
    reference = Column(String, nullable=True, index=True)

    # =========================
    # 🔗 RELATIONS (CRITICAL)
    # =========================
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=True, index=True)

    # =========================
    # 📝 DESCRIPTION
    # =========================
    description = Column(String, nullable=False)

    # =========================
    # ⏱️ TIMESTAMP
    # =========================
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # =========================
    # 🔗 ORM RELATIONSHIPS
    # =========================
    sale = relationship("Sale", backref="ledger_entries")
    payment = relationship("Payment", backref="ledger_entries")

    # =========================
    # ⚡ PERFORMANCE INDEXES
    # =========================
    __table_args__ = (
        Index("idx_ledger_type_date", "type", "created_at"),
        Index("idx_ledger_method_date", "method", "created_at"),
    )