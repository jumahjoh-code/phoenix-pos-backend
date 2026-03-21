from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # 🔹 AUTH
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)

    # 🔹 ROLE SYSTEM (UPDATED)
    role = Column(String, default="cashier")
    # admin | manager | supervisor | store_keeper | cashier | sales | customer

    # 🔹 USER DETAILS (IMPORTANT FOR ECOMMERCE)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    # 🔹 STATUS
    is_active = Column(Boolean, default=True)

    # 🔹 TIMESTAMPS (VERY IMPORTANT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # =========================
    # 🔥 ROLE HELPERS
    # =========================
    def is_admin(self):
        return self.role == "admin"

    def is_manager(self):
        return self.role in ["admin", "manager"]

    def can_access_dashboard(self):
        return self.role in ["admin", "manager", "supervisor"]

    def can_manage_products(self):
        return self.role in ["admin", "manager", "store_keeper"]

    def can_sell(self):
        return self.role in ["admin", "cashier", "sales"]

    def is_customer(self):
        return self.role == "customer"

    # =========================
    # 🔥 SAFE OUTPUT (NO PASSWORD)
    # =========================
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "full_name": self.full_name,
            "phone": self.phone,
            "email": self.email,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }