from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.purchase_schema import PurchaseCreate
from app.services.purchase_service import create_purchase

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)


@router.post("/")
def add_purchase(purchase: PurchaseCreate, db: Session = Depends(get_db)):
    new_purchase = create_purchase(db, purchase)
    return new_purchase