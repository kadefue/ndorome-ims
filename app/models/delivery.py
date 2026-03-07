# app/models/delivery.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id               = Column(Integer, primary_key=True, index=True)
    order_id         = Column(Integer, ForeignKey("orders.id", ondelete="RESTRICT"), nullable=True)
    product_id       = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    received_by_id   = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    quantity         = Column(Integer, nullable=False)
    supplier         = Column(String(200), nullable=True)
    status           = Column(String(30), default="received")
    notes            = Column(String(500), nullable=True)
    date             = Column(DateTime, default=datetime.utcnow, index=True)
    created_at       = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order            = relationship("Order", back_populates="delivery")
    product          = relationship("Product", back_populates="deliveries")
    received_by_user = relationship("User", back_populates="deliveries", foreign_keys=[received_by_id])

    def __repr__(self):
        return f"<Delivery id={self.id} product_id={self.product_id} qty={self.quantity}>"
