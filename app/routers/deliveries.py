# app/routers/deliveries.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, require_manager_above
from app.crud.delivery import get_all_deliveries, get_delivery, create_delivery
from app.crud.delivery import approve_delivery
from app.schemas.delivery import DeliveryCreate, DeliveryResponse
from app.models.user import User
from fastapi import Request
from app.crud.audit import create_audit

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])


@router.get("", response_model=list[DeliveryResponse], summary="List all deliveries")
def list_deliveries(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_deliveries(db, skip=skip, limit=limit)


@router.get("/{delivery_id}", response_model=DeliveryResponse, summary="Get a single delivery")
def get_one_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delivery = get_delivery(db, delivery_id)
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return delivery


@router.post("", response_model=DeliveryResponse, status_code=201, summary="Record an incoming delivery")
def record_delivery(
    delivery_in: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
    request: Request = None,
):
    try:
        created = create_delivery(db, delivery_in, received_by_id=current_user.id)
        try:
            ip = request.client.host if request and request.client else None
            create_audit(db, action='create_delivery', data={'id': created.id, 'order_id': created.order_id, 'quantity': created.quantity}, user_id=current_user.id, username=current_user.name, ip_address=ip)
        except Exception:
            pass
        return created
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.put("/{delivery_id}/approve", response_model=DeliveryResponse, summary="Approve a delivery")
def approve_existing_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    try:
        return approve_delivery(db, delivery_id, approver_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
