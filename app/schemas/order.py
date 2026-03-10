# app/schemas/order.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from app.schemas.product import ProductResponse
from app.schemas.user import UserListResponse


class OrderCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    supplier: Optional[str] = Field(None, max_length=200)
    expected_delivery: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=500)


class OrderUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|in_transit|delivered|cancelled)$")
    expected_delivery: Optional[date] = None
    notes: Optional[str] = None
    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, gt=0)


class OrderResponse(BaseModel):
    id: int
    product_id: int
    ordered_by_id: int
    quantity: int
    unit_price: float
    total: float
    supplier: Optional[str]
    status: str
    expected_delivery: Optional[date]
    notes: Optional[str]
    date: datetime
    created_at: datetime
    updated_at: datetime

    product: Optional[ProductResponse] = None
    ordered_by_user: Optional[UserListResponse] = None

    model_config = {"from_attributes": True}
