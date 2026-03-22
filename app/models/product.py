from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class Product(Base):

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False, index=True)

    barcode = Column(String, unique=True, index=True, nullable=True)

    retail_price = Column(Float, nullable=False, default=0)
    wholesale_price = Column(Float, nullable=True)

    cost_price = Column(Float, nullable=False, default=0)  # 🔥 PROFIT CORE

    stock_quantity = Column(Integer, nullable=False, default=0)

    # 🔥 OPTIONAL (FOR ECOMMERCE FUTURE)
    reserved_stock = Column(Integer, nullable=False, default=0)

    # =========================
    # BUSINESS LOGIC
    # =========================
    @property
    def profit(self):
        return round((self.retail_price or 0) - (self.cost_price or 0), 2)

    @property
    def available_stock(self):
        return max((self.stock_quantity or 0) - (self.reserved_stock or 0), 0)

    @property
    def is_in_stock(self):
        return self.available_stock > 0

    @property
    def is_low_stock(self):
        return 0 < self.available_stock <= 5

    # =========================
    # 🔥 STOCK CONTROL METHODS
    # =========================
    def can_deduct(self, qty: int):
        return self.available_stock >= qty

    def deduct_stock(self, qty: int):
        if qty <= 0:
            return

        if not self.can_deduct(qty):
            raise Exception(f"Insufficient stock for {self.name}")

        self.stock_quantity -= qty

    def restore_stock(self, qty: int):
        if qty <= 0:
            return

        self.stock_quantity += qty

    # =========================
    # 🔥 RESERVED STOCK (ECOMMERCE)
    # =========================
    def reserve_stock(self, qty: int):
        if qty <= 0:
            return

        if self.available_stock < qty:
            raise Exception(f"Not enough stock to reserve for {self.name}")

        self.reserved_stock += qty

    def release_reserved_stock(self, qty: int):
        if qty <= 0:
            return

        self.reserved_stock = max(self.reserved_stock - qty, 0)

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
        self.reserved_stock = int(max(0, self.reserved_stock or 0))

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
            "reserved_stock": int(self.reserved_stock or 0),
            "available_stock": int(self.available_stock),
            "is_in_stock": self.is_in_stock,
            "is_low_stock": self.is_low_stock,
        }