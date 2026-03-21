from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):

    name: str
    barcode: Optional[str] = None

    retail_price: float
    wholesale_price: Optional[float] = None
    cost_price: float

    stock_quantity: int


class ProductResponse(ProductCreate):

    id: int
    profit: float
    is_in_stock: bool
    is_low_stock: bool

    class Config:
        from_attributes = True  # 🔥 FIX for Pydantic v2