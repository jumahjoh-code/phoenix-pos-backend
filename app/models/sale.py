from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, Session

from app.core.database import Base
from app.models.ledger import Ledger


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    total_amount = Column(Float, nullable=False)
    cost_total = Column(Float, nullable=False, default=0)

    amount_paid = Column(Float, nullable=False, default=0)
    balance = Column(Float, nullable=False, default=0)

    payment_method = Column(String, default="cash")
    mpesa_reference = Column(String, nullable=True)

    # MULTI-CHANNEL SUPPORT
    source = Column(String, default="pos")  # pos | ecommerce

    # STATUS
    status = Column(String, default="paid")  # pending | paid | cancelled

    sale_type = Column(String, default="retail")

    receipt_number = Column(String, unique=True, index=True, nullable=True)

    # 🔥 OFFLINE DUPLICATE PROTECTION
    offline_id = Column(String, unique=True, index=True, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # RELATIONSHIPS
    items = relationship("SaleItem", backref="sale", cascade="all, delete-orphan")
    user = relationship("User")

    # =========================
    # PROFIT
    # =========================
    @property
    def profit(self):
        return (self.total_amount or 0) - (self.cost_total or 0)

    # =========================
    # PAYMENT CHECK
    # =========================
    def is_fully_paid(self):
        return (self.amount_paid or 0) >= (self.total_amount or 0)

    # =========================
    # LEDGER RECORDING
    # =========================
    def record_ledger_entries(self, db: Session):

        if self.status != "paid":
            return

        if self.amount_paid <= 0:
            return

        reference = self.receipt_number or f"sale_{self.id}"

        # CASH
        if self.payment_method == "cash":
            db.add(Ledger(
                type="sale",
                amount=self.amount_paid,
                method="cash",
                reference=reference,
                description=f"POS Sale #{self.id}" if self.source == "pos" else f"E-commerce Sale #{self.id}",
                created_at=self.created_at or func.now()
            ))

        # M-PESA
        elif self.payment_method == "mpesa":
            db.add(Ledger(
                type="sale",
                amount=self.amount_paid,
                method="mpesa_business",
                reference=self.mpesa_reference or reference,
                description=f"M-Pesa Sale #{self.id}",
                created_at=self.created_at or func.now()
            ))

        # MIXED PAYMENT
        elif self.payment_method == "mixed":
            cash_part = self.amount_paid * 0.5
            mpesa_part = self.amount_paid * 0.5

            db.add_all([
                Ledger(
                    type="sale",
                    amount=cash_part,
                    method="cash",
                    reference=reference,
                    description=f"Mixed Sale (cash) #{self.id}",
                    created_at=self.created_at or func.now()
                ),
                Ledger(
                    type="sale",
                    amount=mpesa_part,
                    method="mpesa_business",
                    reference=self.mpesa_reference or reference,
                    description=f"Mixed Sale (mpesa) #{self.id}",
                    created_at=self.created_at or func.now()
                )
            ])

    # =========================
    # MARK AS PAID
    # =========================
    def mark_as_paid(self, db: Session, amount: float, method: str, mpesa_ref: str = None):

        self.amount_paid = amount
        self.balance = max((self.total_amount or 0) - amount, 0)

        self.payment_method = method
        self.mpesa_reference = mpesa_ref

        self.status = "paid"

        db.commit()

        self.record_ledger_entries(db)

        db.commit()

    # =========================
    # RECEIPT FORMAT
    # =========================
    def to_receipt_dict(self):
        return {
            "sale_id": self.id,
            "receipt_number": self.receipt_number,
            "offline_id": self.offline_id,
            "source": self.source,
            "status": self.status,
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