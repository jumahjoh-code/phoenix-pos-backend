from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String, nullable=False)  # "user" or "ai"
    message = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)