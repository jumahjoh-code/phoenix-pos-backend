from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer, nullable=False)

    price = Column(Float, nullable=False)  # selling price at time of sale
    cost_price = Column(Float, nullable=False, default=0)  # cost at time of sale

    # 🔥 STORE LINE TOTAL (important)
    line_total = Column(Float, nullable=False, default=0)

    product = relationship("Product")

    # =========================
    # BUSINESS LOGIC
    # =========================
    @property
    def total(self):
        return (self.quantity or 0) * (self.price or 0)

    @property
    def profit(self):
        return ((self.price or 0) - (self.cost_price or 0)) * (self.quantity or 0)

    # =========================
    # VALIDATION
    # =========================
    def sanitize(self):
        if self.quantity <= 0:
            raise ValueError("Quantity must be greater than zero")

        if self.price <= 0:
            raise ValueError("Price must be greater than zero")

        self.line_total = self.total