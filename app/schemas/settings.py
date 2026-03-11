from pydantic import BaseModel
from typing import Optional, List


class CategoryCreate(BaseModel):
    name: str


class CategoryRead(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}


class ProductTemplateCreate(BaseModel):
    name: str
    sku: Optional[str]
    category: Optional[str]
    unit_price: Optional[float]
    supplier: Optional[str]
    location: Optional[str]


class ProductTemplateRead(BaseModel):
    id: int
    name: str
    sku: Optional[str]
    category: Optional[str]
    unit_price: Optional[float]
    supplier: Optional[str]
    location: Optional[str]
    model_config = {"from_attributes": True}


class MotorcycleModelCreate(BaseModel):
    name: str
    categories: Optional[List[str]] = []


class MotorcycleModelRead(BaseModel):
    id: int
    name: str
    categories: Optional[List[str]] = []
    model_config = {"from_attributes": True}
