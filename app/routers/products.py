# app/routers/products.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth import get_current_user, require_manager_above
from app.crud.product import (
    get_product, get_product_by_sku, get_all_products,
    create_product, update_product, delete_product, get_low_stock_products,
)
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.models.user import User

router = APIRouter(prefix="/products", tags=["Inventory / Products"])


@router.get("", response_model=list[ProductResponse], summary="List all products")
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_products(db, skip=skip, limit=limit, category=category, search=search)


@router.get("/low-stock", response_model=list[ProductResponse], summary="Products below minimum stock")
def list_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_low_stock_products(db)


@router.get("/{product_id}", response_model=ProductResponse, summary="Get single product")
def get_one_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201, summary="Add a product")
def add_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    if get_product_by_sku(db, product_in.sku):
        raise HTTPException(status_code=400, detail=f"SKU '{product_in.sku}' already exists")
    return create_product(db, product_in)


@router.put("/{product_id}", response_model=ProductResponse, summary="Update a product")
def edit_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return update_product(db, product, product_in)


@router.delete("/{product_id}", status_code=204, summary="Delete a product")
def remove_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_above),
):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    delete_product(db, product)
