from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.supplier_schema import SupplierCreate, SupplierResponse
from app.services.supplier_service import create_supplier, get_suppliers

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


@router.post("/", response_model=SupplierResponse)
def add_supplier(supplier: SupplierCreate, db: Session = Depends(get_db)):
    new_supplier = create_supplier(db, supplier)
    return new_supplier


@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)):
    suppliers = get_suppliers(db)
    return suppliers