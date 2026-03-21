from pydantic import BaseModel, Field
from typing import List, Optional, Literal


# =========================
# 🔥 SALE ITEMS
# =========================
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: float = Field(gt=0)


# =========================
# 🔥 SALE CREATE
# =========================
class SaleCreate(BaseModel):
    # 🔥 OPTIONAL RELATIONS
    customer_id: Optional[int] = None
    user_id: Optional[int] = None

    # 🔥 MULTI-CHANNEL SUPPORT
    source: Literal["pos", "ecommerce"] = "pos"

    # 🔥 PAYMENT STATUS (CRITICAL)
    status: Literal["pending", "paid"] = "paid"

    # 🔥 PAYMENT METHOD
    payment_method: Optional[Literal["cash", "mpesa", "mixed"]] = "cash"

    # 🔥 TOTALS
    total_amount: float = Field(gt=0)

    # 🔥 PAYMENT DETAILS
    amount_paid: Optional[float] = 0
    mpesa_reference: Optional[str] = None

    # 🔥 ITEMS
    items: List[SaleItemCreate]

    # 🔥 E-COMMERCE SUPPORT
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


# =========================
# 🔥 PAYMENT CONFIRMATION
# =========================
class PaymentConfirm(BaseModel):
    amount: float = Field(gt=0)
    method: Literal["cash", "mpesa"]
    mpesa_reference: Optional[str] = None