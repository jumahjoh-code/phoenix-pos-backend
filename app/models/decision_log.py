from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base

class DecisionLog(Base):
    __tablename__ = "decision_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    reason = Column(String)
    status = Column(String)  # approved / ignored / scheduled
    created_at = Column(DateTime, default=datetime.utcnow)