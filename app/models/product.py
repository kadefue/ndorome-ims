# app/models/product.py
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(200), nullable=False)
    sku          = Column(String(50), unique=True, index=True, nullable=False)
    category     = Column(String(100), nullable=False)
    quantity     = Column(Integer, default=0, nullable=False)
    min_quantity = Column(Integer, default=5, nullable=False)   # Low-stock threshold
    unit_price   = Column(Float, nullable=False)
    supplier     = Column(String(200), nullable=True)
    location     = Column(String(50), nullable=True)           # Shelf/bin location
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales        = relationship("Sale", back_populates="product")
    order_items  = relationship("Order", back_populates="product")
    deliveries   = relationship("Delivery", back_populates="product")

    @property
    def is_low_stock(self) -> bool:
        return self.quantity <= self.min_quantity

    @property
    def inventory_value(self) -> float:
        return self.quantity * self.unit_price

    def __repr__(self):
        return f"<Product id={self.id} sku={self.sku} qty={self.quantity}>"
