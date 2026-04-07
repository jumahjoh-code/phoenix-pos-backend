from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserOut
from app.auth_utils import hash_password
from app.dependencies import require_admin, get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


# =========================
# ➕ CREATE USER
# =========================
@router.post("/", response_model=UserOut)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    existing = db.query(User).filter(User.username == data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=data.username.strip(),
        password=hash_password(data.password),
        role=data.role,
        is_active=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# =========================
# 📋 GET USERS (LIMITED)
# =========================
@router.get("/", response_model=list[UserOut])
def get_users(
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    return db.query(User).order_by(User.id.desc()).limit(100).all()


# =========================
# ✏️ UPDATE USER (SAFE)
# =========================
@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserCreate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔒 Prevent duplicate usernames
    if data.username != user.username:
        exists = db.query(User).filter(User.username == data.username).first()
        if exists:
            raise HTTPException(status_code=400, detail="Username already exists")

    user.username = data.username.strip()
    user.role = data.role

    if data.password:
        user.password = hash_password(data.password)

    db.commit()
    db.refresh(user)

    return user


# =========================
# ❌ DELETE USER (SAFE)
# =========================
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
    current_user=Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🔒 Prevent self-delete
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # 🔒 Prevent deleting last admin
    if user.role == "admin":
        admin_count = db.query(User).filter(User.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete last admin")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}