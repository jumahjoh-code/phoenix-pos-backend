from pydantic import BaseModel


class SupplierBase(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: int

    class Config:
        orm_mode = True