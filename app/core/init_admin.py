from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.auth_utils import hash_password


def create_default_admin():
    db: Session = SessionLocal()

    try:
        user = db.query(User).filter(User.username == "admin").first()

        if not user:
            admin = User(
                username="admin",
                password=hash_password("admin"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("✅ Default admin created")
        else:
            print("ℹ️ Admin already exists")

    finally:
        db.close()
