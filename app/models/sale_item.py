from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer, nullable=False)

    price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False, default=0)

    # 🔥 EXPLICIT RELATIONSHIPS
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")