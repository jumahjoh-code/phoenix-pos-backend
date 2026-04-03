from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth_utils import decode_token

security = HTTPBearer()

# =========================
# 🔐 GET CURRENT USER
# =========================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):

    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return payload


# =========================
# 🛡️ REQUIRE ADMIN
# =========================

def require_admin(user = Depends(get_current_user)):

    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only"
        )

    return user
