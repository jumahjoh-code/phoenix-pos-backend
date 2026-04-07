from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    # =========================
    # 🔗 RELATIONS
    # =========================
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    customer = relationship("Customer")
    user = relationship("User")

    # =========================
    # 💰 FINANCIALS (SAFE)
    # =========================
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    cost_total = Column(Numeric(12, 2), nullable=False, default=0)

    amount_paid = Column(Numeric(12, 2), nullable=False, default=0)
    balance = Column(Numeric(12, 2), nullable=False, default=0)

    # =========================
    # 📌 STATUS
    # =========================
    status = Column(String, default="pending", index=True)  # pending, partial, paid

    # =========================
    # 🧾 RECEIPT
    # =========================
    receipt_number = Column(String, unique=True, index=True, nullable=True)

    # =========================
    # 🔁 SYNC / AUDIT
    # =========================
    sync_status = Column(String, default="pending")  # pending, synced, conflict
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # =========================
    # 🔗 CHILD RELATIONS
    # =========================
    items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )

    payments = relationship(
        "Payment",
        back_populates="sale",
        cascade="all, delete-orphan"
    )

    # =========================
    # 📊 HELPER: PROFIT
    # =========================
    @property
    def profit(self):
        return (self.total_amount or 0) - (self.cost_total or 0)

    # =========================
    # 🔥 CORE: FINANCIAL SYNC
    # =========================
    def update_financials(self, total_paid=None):
        """
        Sync sale financial state.
        If total_paid not provided, compute from payments.
        """
        if total_paid is None:
            total_paid = sum(p.amount for p in self.payments)

        total_paid = total_paid or 0

        self.amount_paid = total_paid

        raw_balance = (self.total_amount or 0) - total_paid
        self.balance = raw_balance if raw_balance > 0 else 0

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

            "total_amount": float(self.total_amount or 0),
            "cost_total": float(self.cost_total or 0),
            "profit": float(self.profit or 0),

            "amount_paid": float(self.amount_paid or 0),
            "balance": float(self.balance or 0),

            "status": self.status,

            "created_at": self.created_at,
            "user": self.user.username if self.user else None,
            "customer": self.customer.name if self.customer else None,

            "payments": [
                {
                    "amount": float(p.amount),
                    "method": p.method,
                    "reference": p.reference,
                    "created_at": p.created_at,
                }
                for p in self.payments
            ],

            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else "Item",
                    "quantity": float(item.quantity),
                    "price": float(item.price),
                    "cost_price": float(item.cost_price or 0),
                    "total": float(item.quantity * item.price),
                }
                for item in self.items
            ],
        }