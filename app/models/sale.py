from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Session

from core.database import Base
from models.ledger import Ledger  # 🔥 IMPORTANT


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    total_amount = Column(Float, nullable=False)
    cost_total = Column(Float, nullable=False, default=0)

    amount_paid = Column(Float, nullable=False, default=0)
    balance = Column(Float, nullable=False, default=0)

    payment_method = Column(String, default="cash")  # 🔥 NEW
    mpesa_reference = Column(String, nullable=True)  # 🔥 NEW

    sale_type = Column(String, default="retail")
    status = Column(String, default="completed")

    receipt_number = Column(String, unique=True, index=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # =========================
    # RELATIONSHIPS
    # =========================
    items = relationship("SaleItem", backref="sale", cascade="all, delete-orphan")
    user = relationship("User")

    # =========================
    # 🔥 HELPER: PROFIT
    # =========================
    @property
    def profit(self):
        return (self.total_amount or 0) - (self.cost_total or 0)

    # =========================
    # 🔥 LEDGER INTEGRATION (CORE)
    # =========================
    def record_ledger_entries(self, db: Session):
        """
        Automatically push this sale into ledger
        """

        if self.amount_paid <= 0:
            return  # nothing paid → no cash/MPESA movement

        # 🔥 CASH PAYMENT
        if self.payment_method == "cash":
            db.add(Ledger(
                type="sale",
                amount=self.amount_paid,
                method="cash",
                reference=self.receipt_number or str(self.id),
                description=f"Sale #{self.id}",
                created_at=self.created_at or func.now()
            ))

        # 🔥 M-PESA BUSINESS PAYMENT
        elif self.payment_method == "mpesa":
            db.add(Ledger(
                type="sale",
                amount=self.amount_paid,
                method="mpesa_business",
                reference=self.mpesa_reference,
                description=f"M-Pesa Sale #{self.id}",
                created_at=self.created_at or func.now()
            ))

        # 🔥 MIXED PAYMENT (ADVANCED)
        elif self.payment_method == "mixed":
            cash_part = float(self.amount_paid or 0) * 0.5
            mpesa_part = float(self.amount_paid or 0) * 0.5

            db.add_all([
                Ledger(
                    type="sale",
                    amount=cash_part,
                    method="cash",
                    reference=self.receipt_number,
                    description=f"Mixed Sale (cash) #{self.id}",
                    created_at=self.created_at or func.now()
                ),
                Ledger(
                    type="sale",
                    amount=mpesa_part,
                    method="mpesa_business",
                    reference=self.mpesa_reference,
                    description=f"Mixed Sale (mpesa) #{self.id}",
                    created_at=self.created_at or func.now()
                )
            ])

    # =========================
    # 🔥 RECEIPT FORMAT
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