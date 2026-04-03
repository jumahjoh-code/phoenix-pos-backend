from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

# =========================
# 🔐 PASSWORD HASHING
# =========================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str):
    return pwd_context.verify(plain, hashed)

# =========================
# 🔑 JWT CONFIG
# =========================

SECRET_KEY = "CHANGE_THIS_TO_STRONG_SECRET"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

# =========================
# 🎟️ TOKEN CREATION
# =========================

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# =========================
# 🔍 TOKEN DECODE
# =========================

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
