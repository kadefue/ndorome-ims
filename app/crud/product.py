# app/crud/product.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def get_product(db: Session, product_id: int) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def get_product_by_sku(db: Session, sku: str) -> Optional[Product]:
    return db.query(Product).filter(Product.sku == sku).first()


def get_product_by_name(db: Session, name: str) -> Optional[Product]:
    return db.query(Product).filter(Product.name == name).first()


def get_all_products(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    category: Optional[str] = None,
    search: Optional[str] = None,
) -> list[Product]:
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    if search:
        term = f"%{search}%"
        query = query.filter(
            Product.name.ilike(term) | Product.sku.ilike(term) | Product.supplier.ilike(term)
        )
    return query.offset(skip).limit(limit).all()


def get_low_stock_products(db: Session) -> list[Product]:
    """Return products where quantity is at or below the minimum threshold."""
    return db.query(Product).filter(Product.quantity <= Product.min_quantity).all()


def create_product(db: Session, product_in: ProductCreate) -> Product:
    # Ensure products are created with zero stock; stock increases only via approved deliveries
    data = product_in.model_dump()
    data['quantity'] = 0
    db_product = Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product: Product, product_in: ProductUpdate) -> Product:
    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product: Product) -> None:
    # Prevent deleting a product that is referenced by orders or deliveries
    from app.models.order import Order
    from app.models.delivery import Delivery

    ord_exists = db.query(Order).filter(Order.product_id == product.id).first()
    if ord_exists:
        raise ValueError("Cannot delete product: referenced by existing orders")
    del_exists = db.query(Delivery).filter(Delivery.product_id == product.id).first()
    if del_exists:
        raise ValueError("Cannot delete product: referenced by existing deliveries")

    db.delete(product)
    db.commit()


def adjust_stock(db: Session, product: Product, delta: int) -> Product:
    """Add or subtract from stock. Raises ValueError if result goes negative."""
    new_qty = product.quantity + delta
    if new_qty < 0:
        raise ValueError(f"Insufficient stock. Available: {product.quantity}, requested: {-delta}")
    product.quantity = new_qty
    db.commit()
    db.refresh(product)
    return product


def get_category_stock_summary(db: Session) -> dict[str, int]:
    """Total units per category for charts."""
    rows = (
        db.query(Product.category, func.sum(Product.quantity))
        .group_by(Product.category)
        .all()
    )
    return {cat: int(qty) for cat, qty in rows}


def get_inventory_value(db: Session) -> float:
    """Sum of (quantity × unit_price) across all products."""
    result = db.query(
        func.sum(Product.quantity * Product.unit_price)
    ).scalar()
    return float(result or 0)
