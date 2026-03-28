from sqlalchemy import Column, Integer, String, Float
from core.database import Base


class Product(Base):

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False, index=True)

    barcode = Column(String, unique=True, index=True, nullable=True)

    retail_price = Column(Float, nullable=False, default=0)
    wholesale_price = Column(Float, nullable=True)

    cost_price = Column(Float, nullable=False, default=0)  # 🔥 PROFIT CORE

    stock_quantity = Column(Integer, nullable=False, default=0)

    # =========================
    # BUSINESS LOGIC
    # =========================
    @property
    def profit(self):
        return round((self.retail_price or 0) - (self.cost_price or 0), 2)

    @property
    def is_in_stock(self):
        return (self.stock_quantity or 0) > 0

    @property
    def is_low_stock(self):
        return 0 < (self.stock_quantity or 0) <= 5

    # =========================
    # VALIDATION (SOFT GUARD)
    # =========================
    def sanitize(self):
        """Ensure no invalid values enter DB"""

        self.retail_price = float(max(0, self.retail_price or 0))
        self.cost_price = float(max(0, self.cost_price or 0))

        if self.wholesale_price is not None:
            self.wholesale_price = float(max(0, self.wholesale_price))

        self.stock_quantity = int(max(0, self.stock_quantity or 0))

    # =========================
    # SERIALIZATION
    # =========================
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "barcode": self.barcode,
            "retail_price": float(self.retail_price or 0),
            "wholesale_price": float(self.wholesale_price) if self.wholesale_price is not None else None,
            "cost_price": float(self.cost_price or 0),
            "profit": float(self.profit),
            "stock_quantity": int(self.stock_quantity or 0),
            "is_in_stock": self.is_in_stock,
            "is_low_stock": self.is_low_stock,
        }