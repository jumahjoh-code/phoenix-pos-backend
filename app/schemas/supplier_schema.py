from pydantic import BaseModel


class SupplierBase(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierResponse(SupplierBase):
    id: int

    model_config = {
        "from_attributes": True
    }