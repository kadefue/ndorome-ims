# app/models/order.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id                = Column(Integer, primary_key=True, index=True)
    product_id        = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    ordered_by_id     = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    quantity          = Column(Integer, nullable=False)
    unit_price        = Column(Float, nullable=False)
    total             = Column(Float, nullable=False)
    supplier          = Column(String(200), nullable=True)
    status            = Column(String(30), default="pending", index=True)
    # Status options: pending | in_transit | delivered | cancelled
    expected_delivery = Column(Date, nullable=True)
    notes             = Column(String(500), nullable=True)
    date              = Column(DateTime, default=datetime.utcnow, index=True)
    created_at        = Column(DateTime, default=datetime.utcnow)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    product           = relationship("Product", back_populates="order_items")
    ordered_by_user   = relationship("User", back_populates="orders", foreign_keys=[ordered_by_id])
    delivery          = relationship("Delivery", back_populates="order", uselist=False)

    def __repr__(self):
        return f"<Order id={self.id} product_id={self.product_id} status={self.status}>"
