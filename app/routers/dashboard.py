# app/routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth import get_current_user
from app.crud.product import get_low_stock_products, get_category_stock_summary, get_inventory_value
from app.crud.sale import get_total_revenue, get_monthly_revenue, get_recent_sales
from app.crud.order import get_pending_orders
from app.models.sale import Sale
from app.models.user import User
from app.schemas.dashboard import DashboardStats
from app.schemas.product import ProductResponse
from app.schemas.sale import SaleResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats, summary="Aggregate stats for dashboard")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_year = datetime.utcnow().year

    Product = __import__("app.models.product", fromlist=["Product"]).Product
    total_products  = db.query(Product).filter(Product.quantity > 0).count()
    total_sales_cnt = db.query(Sale).count()
    low_stock       = get_low_stock_products(db)
    pending_orders  = get_pending_orders(db)
    monthly         = get_monthly_revenue(db, current_year)
    category_stock  = get_category_stock_summary(db)
    inv_value       = get_inventory_value(db)
    total_rev       = get_total_revenue(db)
    recent          = get_recent_sales(db, limit=5)

    return DashboardStats(
        total_revenue=total_rev,
        total_sales=total_sales_cnt,
        inventory_value=inv_value,
        total_products=total_products,
        low_stock_count=len(low_stock),
        pending_orders=len(pending_orders),
        monthly_sales=monthly,
        category_stock=category_stock,
        low_stock_items=[ProductResponse.model_validate(p) for p in low_stock],
        recent_sales=[SaleResponse.model_validate(s) for s in recent],
    )
