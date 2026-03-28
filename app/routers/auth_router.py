from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User
from schemas.user_schema import UserOut, LoginRequest
from auth_utils import verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=UserOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid username")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")

    return user