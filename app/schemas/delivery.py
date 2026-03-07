# app/schemas/delivery.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.product import ProductResponse
from app.schemas.user import UserListResponse
from app.schemas.order import OrderResponse


class DeliveryCreate(BaseModel):
    order_id: Optional[int] = None     # Link to purchase order (optional)
    product_id: int
    quantity: int = Field(..., gt=0)
    supplier: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)


class DeliveryResponse(BaseModel):
    id: int
    order_id: Optional[int]
    product_id: int
    received_by_id: int
    quantity: int
    supplier: Optional[str]
    status: str
    notes: Optional[str]
    date: datetime
    created_at: datetime

    product: Optional[ProductResponse] = None
    received_by_user: Optional[UserListResponse] = None
    order: Optional[OrderResponse] = None

    model_config = {"from_attributes": True}
