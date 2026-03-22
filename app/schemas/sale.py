from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal


# =========================
# 🔥 SALE ITEMS
# =========================
class SaleItemCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)


# =========================
# 🔥 SALE CREATE
# =========================
class SaleCreate(BaseModel):
    # OPTIONAL RELATIONS
    customer_id: Optional[int] = None
    user_id: Optional[int] = None

    # MULTI-CHANNEL
    source: Literal["pos", "ecommerce"] = "pos"

    # STATUS
    status: Literal["pending", "paid"] = "paid"

    # PAYMENT
    payment_method: Optional[Literal["cash", "mpesa", "mixed"]] = "cash"

    # TOTALS
    total_amount: float = Field(..., gt=0)

    # PAYMENT DETAILS
    amount_paid: Optional[float] = 0
    mpesa_reference: Optional[str] = None

    # ITEMS
    items: List[SaleItemCreate]

    # E-COMMERCE
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

    # =========================
    # 🔥 VALIDATIONS
    # =========================

    @validator("items")
    def validate_items(cls, v):
        if not v or len(v) == 0:
            raise ValueError("Cart cannot be empty")
        return v

    @validator("amount_paid", always=True)
    def validate_payment(cls, v, values):
        total = values.get("total_amount", 0)
        method = values.get("payment_method", "cash")
        status = values.get("status", "paid")

        v = v or 0

        # 🔥 CASH RULE
        if method == "cash" and status == "paid" and v < total:
            raise ValueError("Insufficient cash provided")

        # 🔥 M-PESA RULE
        if method == "mpesa" and status == "paid" and not values.get("mpesa_reference"):
            raise ValueError("M-Pesa reference required")

        return v

    @validator("status")
    def validate_status(cls, v, values):
        method = values.get("payment_method", "cash")

        # 🔥 If mpesa, allow pending
        if method == "mpesa" and v not in ["pending", "paid"]:
            raise ValueError("Invalid status for M-Pesa")

        return v

    @validator("total_amount")
    def validate_total(cls, v):
        if v <= 0:
            raise ValueError("Total must be greater than zero")
        return v


# =========================
# 🔥 PAYMENT CONFIRMATION
# =========================
class PaymentConfirm(BaseModel):
    amount: float = Field(..., gt=0)
    method: Literal["cash", "mpesa"]
    mpesa_reference: Optional[str] = None

    @validator("mpesa_reference", always=True)
    def validate_mpesa_ref(cls, v, values):
        if values.get("method") == "mpesa" and not v:
            raise ValueError("M-Pesa reference required")
        return v