from sqlalchemy import Column, Integer, Float, String, DateTime
from datetime import datetime
from app.core.database import Base


class Ledger(Base):
    __tablename__ = "ledger"

    id = Column(Integer, primary_key=True, index=True)

    # 🔥 TYPE OF ENTRY
    type = Column(String, nullable=False)
    # sale | mpesa_deposit | mpesa_withdraw | expense | adjustment

    # 🔥 AMOUNT
    amount = Column(Float, nullable=False)

    # 🔥 PAYMENT CHANNEL
    method = Column(String, nullable=False)
    # cash | mpesa_business | mpesa_agent | bank | mixed

    # 🔥 SOURCE (VERY IMPORTANT FOR YOUR SYSTEM)
    source = Column(String, default="pos")
    # pos | ecommerce | system

    # 🔥 REFERENCE (SAFE TRACKING)
    reference = Column(String, nullable=True)
    # receipt_number | mpesa_code | internal_ref

    # 🔥 DESCRIPTION
    description = Column(String)

    # 🔥 OPTIONAL STATUS (FUTURE SAFE)
    status = Column(String, default="completed")
    # completed | pending | reversed

    # 🔥 CREATED TIME
    created_at = Column(DateTime, default=datetime.utcnow)

    # =========================
    # 🔥 HELPER: FORMAT OUTPUT
    # =========================
    def to_dict(self):
        return {
            "id": self.id,
            "type": self.type,
            "amount": self.amount,
            "method": self.method,
            "source": self.source,
            "reference": self.reference,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at,
        }