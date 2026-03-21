from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime
from app.core.database import Base

class AILearning(Base):
    __tablename__ = "ai_learning"

    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow)

    sales = Column(Float)
    profit = Column(Float)
    profit_margin = Column(Float)
    growth = Column(Float)