from pydantic import BaseModel

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: str


class CustomerResponse(CustomerCreate):
    id: int

    model_config = {
        "from_attributes": True
    }