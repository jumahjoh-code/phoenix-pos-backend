from sqlalchemy.orm import Session
from models.inventory import Inventory


def get_inventory(db: Session):
    return db.query(Inventory).all()


def update_stock(db: Session, product_id: int, quantity: int):
    stock = db.query(Inventory).filter(Inventory.product_id == product_id).first()

    if stock:
        stock.quantity += quantity
    else:
        stock = Inventory(product_id=product_id, quantity=quantity)
        db.add(stock)

    db.commit()
    db.refresh(stock)

    return stock