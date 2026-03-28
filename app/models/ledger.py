# models/ledger.py

from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.core.database import Base

class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # sale, mpesa_deposit, mpesa_withdraw, expense
    amount = Column(Float)
    method = Column(String)  # cash, mpesa
    reference = Column(String, nullable=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)