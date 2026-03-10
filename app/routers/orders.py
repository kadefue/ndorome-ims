# app/routers/orders.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user, require_manager_above
from app.crud.order import get_all_orders, get_order, create_order, update_order
from app.schemas.delivery import DeliveryCreate
from app.crud.delivery import create_delivery
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Purchase Orders"])


@router.get("", response_model=list[OrderResponse], summary="List all purchase orders")
def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_orders(db, skip=skip, limit=limit, status=status)


@router.get("/{order_id}", response_model=OrderResponse, summary="Get a single order")
def get_one_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201, summary="Create a purchase order")
def create_new_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    return create_order(db, order_in, ordered_by_id=current_user.id)


@router.put("/{order_id}", response_model=OrderResponse, summary="Update order status / details")
def update_existing_order(
    order_id: int,
    order_in: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "delivered" and order_in.status and order_in.status != "delivered":
        raise HTTPException(status_code=400, detail="Cannot change status of a delivered order")
    updated = update_order(db, order, order_in)

    # If order was marked delivered, ensure a delivery record exists (auto-create)
    try:
        incoming_status = order_in.model_dump().get("status") if order_in is not None else None
    except Exception:
        incoming_status = None

    if (incoming_status == "delivered" or (updated and updated.status == "delivered")):
        # create delivery if not exists
        if not updated.delivery:
            delivery_payload = DeliveryCreate(
                order_id=updated.id,
                product_id=updated.product_id,
                quantity=updated.quantity,
                supplier=updated.supplier,
                notes="Auto-created from order marked delivered",
            )
            try:
                create_delivery(db, delivery_payload, received_by_id=current_user.id)
            except ValueError:
                # ignore if creation blocked (e.g., already approved)
                pass

    return get_order(db, order_id)
