# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(20), nullable=False, default="employee")  # owner | manager | employee
    active          = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    sales           = relationship("Sale", back_populates="employee", foreign_keys="Sale.employee_id")
    orders          = relationship("Order", back_populates="ordered_by_user", foreign_keys="Order.ordered_by_id")
    deliveries      = relationship("Delivery", back_populates="received_by_user", foreign_keys="Delivery.received_by_id")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
