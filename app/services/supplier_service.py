from sqlalchemy.orm import Session
from models.supplier import Supplier


def create_supplier(db: Session, supplier):
    new_supplier = Supplier(**supplier.dict())
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    return new_supplier


def get_suppliers(db: Session):
    return db.query(Supplier).all()