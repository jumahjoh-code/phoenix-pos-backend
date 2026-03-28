from sqlalchemy import Column, Integer, ForeignKey
from core.database import Base


class PurchaseItem(Base):
    __tablename__ = "purchase_item"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchase.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)