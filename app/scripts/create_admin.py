from app.core.database import SessionLocal
from app.models.user import User
from app.auth_utils import hash_password

def create_admin():
    db = SessionLocal()

    try:
        existing = db.query(User).filter(User.username == "admin").first()

        if existing:
            print("⚠️ Admin already exists")
            return

        admin = User(
            username="admin",
            password=hash_password("admin123"),
            role="admin",
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("✅ Admin created successfully")

    except Exception as e:
        print("❌ Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
