# app/schemas/dashboard.py
from pydantic import BaseModel
from typing import Any


class DashboardStats(BaseModel):
    total_revenue: float
    total_sales: int
    inventory_value: float
    total_products: int
    low_stock_count: int
    pending_orders: int
    monthly_sales: dict[str, float]
    category_stock: dict[str, int]
    low_stock_items: list[Any]
    recent_sales: list[Any]
