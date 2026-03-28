from sqlalchemy.orm import Session
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.services.inventory_service import update_stock


def create_purchase(db: Session, purchase_data):
    purchase = Purchase(supplier_id=purchase_data.supplier_id)
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    for item in purchase_data.items:
        purchase_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item.product_id,
            quantity=item.quantity
        )
        db.add(purchase_item)

        update_stock(db, item.product_id, item.quantity)

    db.commit()

    return purchase