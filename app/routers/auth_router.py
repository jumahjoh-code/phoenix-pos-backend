from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

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
# 🔐 LOGIN
# =========================
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.username == data.username).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid username")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="User inactive")

    payload = {
        "sub": user.username,
        "role": user.role,
        "id": user.id
    }

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


# =========================
# 🔄 REFRESH TOKEN
# =========================
@router.post("/refresh")
def refresh_token(refresh_token: str):

    payload = verify_token(refresh_token, expected_type="refresh")

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
# 🔓 LOGOUT (BLACKLIST)
# =========================
@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials

    blacklist_token(token)

    return {"message": "Logged out successfully"}
