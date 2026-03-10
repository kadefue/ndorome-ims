# app/crud/delivery.py
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.models.delivery import Delivery
from app.models.order import Order
from app.models.product import Product
from app.schemas.delivery import DeliveryCreate


def get_delivery(db: Session, delivery_id: int) -> Optional[Delivery]:
    return (
        db.query(Delivery)
        .options(
            joinedload(Delivery.product),
            joinedload(Delivery.received_by_user),
            joinedload(Delivery.order),
        )
        .filter(Delivery.id == delivery_id)
        .first()
    )


def get_all_deliveries(db: Session, skip: int = 0, limit: int = 200) -> list[Delivery]:
    return (
        db.query(Delivery)
        .options(
            joinedload(Delivery.product),
            joinedload(Delivery.received_by_user),
            joinedload(Delivery.order),
        )
        .order_by(Delivery.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_delivery(db: Session, delivery_in: DeliveryCreate, received_by_id: int) -> Delivery:
    # Validate product exists
    product = db.query(Product).filter(Product.id == delivery_in.product_id).first()
    if not product:
        raise ValueError("Product not found")

    # If linked to an order, prevent creating a new delivery when an approved delivery already exists
    if delivery_in.order_id:
        existing = db.query(Delivery).filter(Delivery.order_id == delivery_in.order_id).first()
        if existing and existing.status == "approved":
            raise ValueError("A delivery for this order has already been approved")

    db_delivery = Delivery(
        order_id=delivery_in.order_id,
        product_id=delivery_in.product_id,
        received_by_id=received_by_id,
        quantity=delivery_in.quantity,
        supplier=delivery_in.supplier or (product.supplier if product else None),
        status="received",
        notes=delivery_in.notes,
    )

    # Restock inventory
    product.quantity += delivery_in.quantity

    # Mark linked order as delivered
    if delivery_in.order_id:
        order = db.query(Order).filter(Order.id == delivery_in.order_id).first()
        if order and order.status != "delivered":
            order.status = "delivered"

    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return get_delivery(db, db_delivery.id)


def approve_delivery(db: Session, delivery_id: int, approver_id: int) -> Delivery:
    delivery = db.query(Delivery).filter(Delivery.id == delivery_id).first()
    if not delivery:
        raise ValueError("Delivery not found")
    if delivery.status == "approved":
        raise ValueError("Delivery already approved")

    # Mark delivery approved
    delivery.status = "approved"

    # Ensure linked order is marked delivered
    if delivery.order_id:
        order = db.query(Order).filter(Order.id == delivery.order_id).first()
        if order and order.status != "delivered":
            order.status = "delivered"

    db.commit()
    db.refresh(delivery)
    return get_delivery(db, delivery.id)
