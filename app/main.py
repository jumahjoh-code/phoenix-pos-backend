from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# =========================
# IMPORT MODELS (REGISTER TABLES)
# =========================
from app.models import (
    product,
    customer,
    user,
    sale,
    sale_item,
    payment,
    inventory,
    supplier,
    purchase,
    purchase_item,

    # 🔥 NEW: LEDGER MODEL
    ledger
)

# =========================
# ROUTERS
# =========================
from app.routers.product_router import router as product_router
from app.routers.customer_router import router as customer_router
from app.routers.sales_router import router as sales_router
from app.routers.inventory_router import router as inventory_router
from app.routers.supplier_router import router as supplier_router
from app.routers.purchase_router import router as purchase_router
from app.routers.dashboard_router import router as dashboard_router

# Users & Auth
from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router

# Payments
from app.routers.payment_router import router as payment_router

# M-Pesa
from app.routers.mpesa_router import router as mpesa_router

# 🔥 NEW: LEDGER ROUTER (CRITICAL)
from app.routers.ledger_router import router as ledger_router


# =========================
# APP INIT
# =========================
app = FastAPI(
    title="Phoenix POS",
    version="2.0.0"
)


# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# STARTUP
# =========================
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# =========================
# ROUTERS
# =========================
app.include_router(product_router)
app.include_router(customer_router)
app.include_router(sales_router)
app.include_router(inventory_router)
app.include_router(supplier_router)
app.include_router(purchase_router)
app.include_router(dashboard_router)

# Users & Auth
app.include_router(user_router)
app.include_router(auth_router)

# Payments
app.include_router(payment_router)

# M-Pesa
app.include_router(mpesa_router)

# 🔥 LEDGER (MOST IMPORTANT)
app.include_router(ledger_router)


# =========================
# HEALTH CHECK / ROOT
# =========================
@app.get("/")
def root():
    return {
        "message": "Phoenix POS Backend Running",
        "version": "2.0.0",
        "modules": [
            "products",
            "sales",
            "inventory",
            "payments",
            "mpesa",
            "ledger"
        ]
    }