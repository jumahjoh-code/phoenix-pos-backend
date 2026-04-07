from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import LoginRequest
from app.auth_utils import verify_password

from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token
)

from app.core.token_blacklist import blacklist_token


router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


# =========================
# 📦 REFRESH REQUEST SCHEMA (FIX)
# =========================
class RefreshRequest(BaseModel):
    refresh_token: str


# =========================
# 🔐 LOGIN (HARDENED)
# =========================
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    # 🔒 Generic error (prevents user enumeration)
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")

    payload = {
        "sub": user.username,
        "role": user.role,
        "id": user.id
    }

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }


# =========================
# 🔄 REFRESH TOKEN (FIXED)
# =========================
@router.post("/refresh")
def refresh_token(data: RefreshRequest):

    payload = verify_token(data.refresh_token, expected_type="refresh")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_payload = {
        "sub": payload["sub"],
        "role": payload["role"],
        "id": payload["id"]
    }

    return {
        "access_token": create_access_token(new_payload)
    }


# =========================
# 🔓 LOGOUT (BLACKLIST SAFE)
# =========================
@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    try:
        blacklist_token(token)
    except Exception as e:
        print("Blacklist error:", e)

    return {"message": "Logged out successfully"}