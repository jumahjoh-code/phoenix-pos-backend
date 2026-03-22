from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)

    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    change = Column(Integer, nullable=False)  # +10, -2, etc

    movement_type = Column(String, nullable=False)  
    # sale | purchase | adjustment | cancel | refund | reserve | release

    reference = Column(String, nullable=True)  
    # sale_id, order_id, manual note, etc

    note = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # RELATIONSHIP
    product = relationship("Product")

    # =========================
    # HELPER
    # =========================
    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "change": self.change,
            "movement_type": self.movement_type,
            "reference": self.reference,
            "note": self.note,
            "created_at": self.created_at
        }