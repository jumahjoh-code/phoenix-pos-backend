from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.schemas.product_schema import ProductCreate

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# =========================
# CREATE PRODUCT
# =========================
@router.post("/")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):

    new_product = Product(**product.model_dump())

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product.to_dict()


# =========================
# LIST PRODUCTS
# =========================
@router.get("/")
def list_products(db: Session = Depends(get_db)):

    products = db.query(Product).all()

    return [p.to_dict() for p in products]


# =========================
# UPDATE PRODUCT
# =========================
@router.put("/{product_id}")
def update_product(product_id: int, data: ProductCreate, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for key, value in data.model_dump().items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    return product.to_dict()


# =========================
# DELETE PRODUCT
# =========================
@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()

    return {"message": "Product deleted"}


# =========================
# ADJUST STOCK
# =========================
@router.put("/{product_id}/stock")
def adjust_stock(product_id: int, quantity: int, db: Session = Depends(get_db)):

    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if quantity < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    product.stock_quantity = quantity

    db.commit()
    db.refresh(product)

    return product.to_dict()