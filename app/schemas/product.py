# app/schemas/product.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.settings import MotorcycleModelRead


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    sku: str = Field(..., min_length=2, max_length=50)
    category: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., ge=0)
    min_quantity: int = Field(default=5, ge=0)
    unit_price: float = Field(..., gt=0)
    supplier: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=50)
    motorcycle_model_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[int] = Field(None, ge=0)
    min_quantity: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, gt=0)
    supplier: Optional[str] = None
    location: Optional[str] = None
    motorcycle_model_id: Optional[int] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    display_name: str
    sku: str
    category: str
    quantity: int
    min_quantity: int
    unit_price: float
    supplier: Optional[str]
    location: Optional[str]
    motorcycle_model_id: Optional[int]
    motorcycle_model: Optional[MotorcycleModelRead]
    is_low_stock: bool
    inventory_value: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
