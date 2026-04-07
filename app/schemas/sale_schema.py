from pydantic import BaseModel, Field
from typing import List, Optional


# =========================
# 📦 ITEMS
# =========================
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)


# =========================
# 💰 PAYMENTS
# =========================
class PaymentCreate(BaseModel):
    amount: float = Field(gt=0)
    method: str = Field(default="cash")  # cash, mpesa, bank
    reference: Optional[str] = None


# =========================
# 🧾 SALE CREATE
# =========================
class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[SaleItemCreate]
    payments: List[PaymentCreate] = []