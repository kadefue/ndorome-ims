# app/crud/order.py
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.models.order import Order
from app.schemas.order import OrderCreate, OrderUpdate


def get_order(db: Session, order_id: int) -> Optional[Order]:
    o = (
        db.query(Order)
        .options(joinedload(Order.product), joinedload(Order.ordered_by_user), joinedload(Order.delivery))
        .filter(Order.id == order_id)
        .first()
    )
    if o and getattr(o, 'delivery', None):
        # attach minimal delivery info for response schema
        try:
            o.delivery_id = o.delivery.id
            o.delivery_status = o.delivery.status
        except Exception:
            o.delivery_id = None
            o.delivery_status = None
    return o


def get_all_orders(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    status: Optional[str] = None,
) -> list[Order]:
    query = (
        db.query(Order)
        .options(joinedload(Order.product), joinedload(Order.ordered_by_user), joinedload(Order.delivery))
        .order_by(Order.date.desc())
    )
    if status:
        query = query.filter(Order.status == status)
    rows = query.offset(skip).limit(limit).all()
    for o in rows:
        if getattr(o, 'delivery', None):
            try:
                o.delivery_id = o.delivery.id
                o.delivery_status = o.delivery.status
            except Exception:
                o.delivery_id = None
                o.delivery_status = None
    return rows


def get_pending_orders(db: Session) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.status.in_(["pending", "in_transit"]))
        .all()
    )


def create_order(db: Session, order_in: OrderCreate, ordered_by_id: int) -> Order:
    total = order_in.quantity * order_in.unit_price
    db_order = Order(
        product_id=order_in.product_id,
        ordered_by_id=ordered_by_id,
        quantity=order_in.quantity,
        unit_price=order_in.unit_price,
        total=total,
        supplier=order_in.supplier,
        expected_delivery=order_in.expected_delivery,
        notes=order_in.notes,
        status="pending",
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return get_order(db, db_order.id)


def update_order(db: Session, order: Order, order_in: OrderUpdate) -> Order:
    update_data = order_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        # Avoid overwriting non-nullable DB columns with None
        col = getattr(order.__table__.c, field, None)
        if col is not None and value is None and not col.nullable:
            # skip assignment to preserve existing non-nullable value
            continue
        setattr(order, field, value)
    # Recalculate total if quantity or unit_price changed (or both)
    if 'quantity' in update_data or 'unit_price' in update_data:
        try:
            order.total = order.quantity * order.unit_price
        except Exception:
            pass
    db.commit()
    db.refresh(order)
    return get_order(db, order.id)
