from pydantic import BaseModel


class PurchaseItemSchema(BaseModel):
    product_id: int
    quantity: int


class PurchaseCreate(BaseModel):
    supplier_id: int
    items: list[PurchaseItemSchema]