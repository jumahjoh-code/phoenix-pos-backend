from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime
from datetime import datetime
from core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)

    payment_method = Column(String, nullable=False)  # cash, mpesa, card
    amount = Column(Float, nullable=False)

    status = Column(String, default="pending")  # pending, completed, failed

    reference = Column(String, nullable=True)  # M-Pesa receipt number
    checkout_request_id = Column(String, nullable=True, index=True)

    created_at = Column(DateTime, default=datetime.utcnow)