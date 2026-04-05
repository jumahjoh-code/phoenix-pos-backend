from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 RELATIONS
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # 💰 FINANCIALS
    total_amount = Column(Float, nullable=False)
    cost_total = Column(Float, nullable=False, default=0)

    amount_paid = Column(Float, nullable=False, default=0)
    balance = Column(Float, nullable=False, default=0)

    # 💳 PAYMENT INFO
    payment_method = Column(String, default="cash")
    mpesa_reference = Column(String, nullable=True)

    # 📌 STATUS
    status = Column(String, default="pending", index=True)

    # 🧾 RECEIPT
    receipt_number = Column(String, unique=True, index=True, nullable=True)

    # ⏱️ TIMESTAMP
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # =========================
    # 🔗 RELATIONSHIPS (FIXED)
    # =========================
    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )

    user = relationship("User")

    # =========================
    # 📊 HELPER: PROFIT
    # =========================
    @property
    def profit(self):
        return (self.total_amount or 0) - (self.cost_total or 0)

    # =========================
    # 🔥 CORE: SYNC FINANCIAL STATE
    # =========================
    def update_financials(self, total_paid: float):
        total_paid = total_paid or 0

        self.amount_paid = total_paid
        self.balance = (self.total_amount or 0) - total_paid

        if total_paid <= 0:
            self.status = "pending"
        elif total_paid < self.total_amount:
            self.status = "partial"
        else:
            self.status = "paid"

    # =========================
    # 🧾 RECEIPT FORMAT
    # =========================
    def to_receipt_dict(self):
        return {
            "sale_id": self.id,
            "receipt_number": self.receipt_number,
            "total_amount": self.total_amount,
            "cost_total": self.cost_total,
            "profit": self.profit,
            "amount_paid": self.amount_paid,
            "balance": self.balance,
            "payment_method": self.payment_method,
            "created_at": self.created_at,
            "user": self.user.username if self.user else None,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Item",
                    "quantity": item.quantity,
                    "price": item.price,
                    "cost_price": item.cost_price,
                    "total": item.quantity * item.price,
                }
                for item in self.items
            ],
        }