from pydantic import BaseModel, Field
from typing import List, Literal


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: int = Field(gt=0)


class SaleCreate(BaseModel):
    customer_id: int | None = None
    user_id: int
    sale_type: Literal["cash", "mpesa"]
    items: List[SaleItemCreate]
    total: int = Field(gt=0)