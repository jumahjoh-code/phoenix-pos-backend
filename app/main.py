print("🔥 MAIN FILE LOADED 🔥")
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.database import Base, engine
from app.core.init_admin import create_default_admin

# =========================
# IMPORT MODELS
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
from app.routers.user_router import router as user_router
from app.routers.auth_router import router as auth_router
from app.routers.payment_router import router as payment_router
from app.routers.mpesa_router import router as mpesa_router
from app.routers.ledger_router import router as ledger_router

# =========================
# APP INIT
# =========================
app = FastAPI(title="Phoenix POS", version="2.0.0")

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    create_default_admin()

# =========================
# ROUTERS (GLOBAL /api PREFIX)
# =========================
app.include_router(product_router, prefix="/api")
app.include_router(customer_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(supplier_router, prefix="/api")
app.include_router(purchase_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
app.include_router(mpesa_router, prefix="/api")
app.include_router(ledger_router, prefix="/api")

# =========================
# FRONTEND PATH
# =========================
frontend_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "build")
)

# =========================
# SERVE FRONTEND
# =========================
if os.path.exists(frontend_path):

    app.mount(
        "/static",
        StaticFiles(directory=os.path.join(frontend_path, "static")),
        name="static"
    )

    @app.get("/manifest.json")
    async def manifest():
        return FileResponse(
            os.path.join(frontend_path, "manifest.json"),
            media_type="application/json"
        )

    @app.get("/favicon.ico")
    async def favicon():
        return FileResponse(os.path.join(frontend_path, "favicon.ico"))

    @app.get("/logo192.png")
    async def logo192():
        return FileResponse(os.path.join(frontend_path, "logo192.png"))

    @app.get("/logo512.png")
    async def logo512():
        return FileResponse(os.path.join(frontend_path, "logo512.png"))

    @app.get("/")
    async def serve_react():
        return FileResponse(os.path.join(frontend_path, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):

        # 🚫 PROTECT BACKEND ROUTES
        if full_path.startswith((
            "api",
            "auth",
            "users",
            "products",
            "sales",
            "inventory",
            "suppliers",
            "purchases",
            "dashboard",
            "payments",
            "mpesa",
            "ledger"
        )):
            raise HTTPException(status_code=404, detail="Not Found")

        return FileResponse(os.path.join(frontend_path, "index.html"))