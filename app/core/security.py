from datetime import datetime, timedelta
from jose import jwt, JWTError

# 🔐 CONFIG
SECRET_KEY = "phoenix_pos_super_secret_2026"
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# ✅ IMPORT BLACKLIST
from app.core.token_blacklist import is_token_blacklisted


# =========================
# 🔐 CREATE TOKENS
# =========================
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =========================
# 🔍 VERIFY TOKEN (STRICT)
# =========================
def verify_token(token: str, expected_type: str = "access"):
    try:
        # 🚫 BLOCK BLACKLISTED TOKENS
        if is_token_blacklisted(token):
            return None

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # 🚨 CHECK TOKEN TYPE
        if payload.get("type") != expected_type:
            return None

        return payload

    except JWTError:
        return None
