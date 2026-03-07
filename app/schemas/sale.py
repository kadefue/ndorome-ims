# app/schemas/sale.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.product import ProductResponse
from app.schemas.user import UserListResponse


class SaleCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    customer: Optional[str] = Field(None, max_length=150)
    payment: str = Field(default="Cash", pattern="^(Cash|M-Pesa|Bank Transfer|Credit)$")
    notes: Optional[str] = Field(None, max_length=500)


class SaleResponse(BaseModel):
    id: int
    product_id: int
    employee_id: int
    quantity: int
    unit_price: float
    total: float
    customer: Optional[str]
    payment: str
    status: str
    notes: Optional[str]
    date: datetime
    created_at: datetime

    # Nested relations (populated by ORM)
    product: Optional[ProductResponse] = None
    employee: Optional[UserListResponse] = None

    model_config = {"from_attributes": True}
