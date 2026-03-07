# app/routers/sales.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.crud.sale import get_all_sales, get_sale, create_sale
from app.schemas.sale import SaleCreate, SaleResponse
from app.models.user import User

router = APIRouter(prefix="/sales", tags=["Sales"])


@router.get("", response_model=list[SaleResponse], summary="List all sales")
def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Employees can only see their own sales
    if current_user.role == "employee":
        employee_id = current_user.id
    return get_all_sales(db, skip=skip, limit=limit, employee_id=employee_id)


@router.get("/{sale_id}", response_model=SaleResponse, summary="Get a single sale")
def get_one_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sale = get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    # Employees can only view their own sales
    if current_user.role == "employee" and sale.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return sale


@router.post("", response_model=SaleResponse, status_code=201, summary="Record a sale")
def record_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return create_sale(db, sale_in, employee_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
