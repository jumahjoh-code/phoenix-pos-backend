from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import LoginRequest
from app.auth_utils import verify_password

# ✅ ADD THIS
from app.core.security import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid username")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")

    # 🔐 TOKEN PAYLOAD
    payload = {
        "sub": user.username,
        "role": user.role,
        "id": user.id
    }

    # 🔥 RETURN TOKENS (CRITICAL CHANGE)
    return {
        "access_token": create_access_token(payload),
        "refresh_token": create_refresh_token(payload),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }
