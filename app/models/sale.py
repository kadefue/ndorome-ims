# app/models/sale.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id           = Column(Integer, primary_key=True, index=True)
    product_id   = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    employee_id  = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    quantity     = Column(Integer, nullable=False)
    unit_price   = Column(Float, nullable=False)      # Price captured at time of sale
    total        = Column(Float, nullable=False)
    customer     = Column(String(150), nullable=True)
    customer_email = Column(String(150), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    payment      = Column(String(50), default="Cash") # Cash | M-Pesa | Bank Transfer | Credit
    status       = Column(String(30), default="completed")
    notes        = Column(String(500), nullable=True)
    date         = Column(DateTime, default=datetime.utcnow, index=True)
    created_at   = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product      = relationship("Product", back_populates="sales")
    employee     = relationship("User", back_populates="sales", foreign_keys=[employee_id])

    def __repr__(self):
        return f"<Sale id={self.id} product_id={self.product_id} total={self.total}>"
