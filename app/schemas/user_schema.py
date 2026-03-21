from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "cashier"

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str