# app/crud/sale.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from datetime import datetime
from typing import Optional

from app.models.sale import Sale
from app.models.product import Product
from app.schemas.sale import SaleCreate


def get_sale(db: Session, sale_id: int) -> Optional[Sale]:
    return (
        db.query(Sale)
        .options(joinedload(Sale.product), joinedload(Sale.employee))
        .filter(Sale.id == sale_id)
        .first()
    )


def get_all_sales(
    db: Session,
    skip: int = 0,
    limit: int = 200,
    employee_id: Optional[int] = None,
) -> list[Sale]:
    query = (
        db.query(Sale)
        .options(joinedload(Sale.product), joinedload(Sale.employee))
        .order_by(Sale.date.desc())
    )
    if employee_id:
        query = query.filter(Sale.employee_id == employee_id)
    return query.offset(skip).limit(limit).all()


def create_sale(db: Session, sale_in: SaleCreate, employee_id: int) -> Sale:
    product = db.query(Product).filter(Product.id == sale_in.product_id).first()
    if not product:
        raise ValueError("Product not found")
    if product.quantity < sale_in.quantity:
        raise ValueError(
            f"Insufficient stock. Available: {product.quantity}, requested: {sale_in.quantity}"
        )

    total = product.unit_price * sale_in.quantity

    db_sale = Sale(
        product_id=sale_in.product_id,
        employee_id=employee_id,
        quantity=sale_in.quantity,
        unit_price=product.unit_price,   # Snapshot price at sale time
        total=total,
        customer=sale_in.customer,
        payment=sale_in.payment,
        status="completed",
        notes=sale_in.notes,
        date=datetime.utcnow(),
    )
    # Deduct stock
    product.quantity -= sale_in.quantity

    db.add(db_sale)
    db.commit()
    db.refresh(db_sale)
    # Reload relationships
    return get_sale(db, db_sale.id)


def get_total_revenue(db: Session) -> float:
    result = db.query(func.sum(Sale.total)).scalar()
    return float(result or 0)


def get_monthly_revenue(db: Session, year: int) -> dict[str, float]:
    """Returns monthly revenue totals for a given year."""
    MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    rows = (
        db.query(extract("month", Sale.date).label("m"), func.sum(Sale.total))
        .filter(extract("year", Sale.date) == year)
        .group_by("m")
        .all()
    )
    result = {m: 0.0 for m in MONTHS}
    for m, total in rows:
        result[MONTHS[int(m) - 1]] = float(total or 0)
    return result


def get_recent_sales(db: Session, limit: int = 5) -> list[Sale]:
    return (
        db.query(Sale)
        .options(joinedload(Sale.product), joinedload(Sale.employee))
        .order_by(Sale.date.desc())
        .limit(limit)
        .all()
    )
