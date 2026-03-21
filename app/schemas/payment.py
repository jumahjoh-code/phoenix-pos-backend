from pydantic import BaseModel, Field
from typing import Literal


# =========================
# 🔷 CREATE PAYMENT (GENERIC)
# =========================
class PaymentCreate(BaseModel):
    sale_id: int
    payment_method: Literal["cash", "mpesa"]  # 🔥 restrict values
    amount: int = Field(gt=0)  # 🔥 no negative or zero payments


# =========================
# 🔷 CASH PAYMENT REQUEST
# =========================
class CashPaymentRequest(BaseModel):
    sale_id: int
    amount: int = Field(gt=0)


# =========================
# 🔷 M-PESA STK REQUEST
# =========================
class STKPushRequest(BaseModel):
    sale_id: int
    phone: str = Field(
        min_length=12,
        max_length=12,
        pattern=r"^254\d{9}$"  # 🔥 enforce 2547XXXXXXXX format
    )
    amount: int = Field(gt=0)


# =========================
# 🔷 RESPONSE SCHEMA
# =========================
class PaymentResponse(BaseModel):
    id: int
    sale_id: int
    payment_method: str
    amount: int
    status: str

    class Config:
        from_attributes = True