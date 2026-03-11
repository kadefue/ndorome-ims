from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth import require_manager_above
from app.crud import settings as settings_crud
from app.schemas import settings as settings_schemas
from app.models.product import Product
from app.models.setting import Category, MotorcycleModel

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get('/categories', response_model=List[settings_schemas.CategoryRead], dependencies=[Depends(require_manager_above)])
def list_categories(db: Session = Depends(get_db)):
    return settings_crud.get_categories(db)


@router.post('/categories', response_model=settings_schemas.CategoryRead, dependencies=[Depends(require_manager_above)])
def create_category(payload: settings_schemas.CategoryCreate, db: Session = Depends(get_db)):
    existing = [c for c in settings_crud.get_categories(db) if c.name.lower() == payload.name.lower()]
    if existing:
        raise HTTPException(status_code=400, detail='Category already exists')
    return settings_crud.create_category(db, payload.name)


@router.delete('/categories/{category_id}', dependencies=[Depends(require_manager_above)])
def delete_category(category_id: int, db: Session = Depends(get_db)):
    # prevent deleting a category that is referenced by products
    obj = db.get(settings_crud.Category, category_id) if hasattr(settings_crud, 'Category') else None
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    used = db.query(Product).filter(Product.category == obj.name).first()
    if used:
        raise HTTPException(status_code=400, detail='Category is in use and cannot be deleted')
    settings_crud.delete_category(db, category_id)
    return {"ok": True}


@router.put('/categories/{category_id}', response_model=settings_schemas.CategoryRead, dependencies=[Depends(require_manager_above)])
def update_category(category_id: int, payload: settings_schemas.CategoryCreate, db: Session = Depends(get_db)):
    obj = db.get(settings_crud.Category, category_id) if hasattr(settings_crud, 'Category') else None
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    # ensure unique name
    existing = [c for c in settings_crud.get_categories(db) if c.name.lower() == payload.name.lower() and c.id != category_id]
    if existing:
        raise HTTPException(status_code=400, detail='Category already exists')
    obj.name = payload.name
    db.commit()
    db.refresh(obj)
    return obj


@router.get('/templates', response_model=List[settings_schemas.ProductTemplateRead], dependencies=[Depends(require_manager_above)])
def list_templates(db: Session = Depends(get_db)):
    return settings_crud.get_templates(db)


@router.post('/templates', response_model=settings_schemas.ProductTemplateRead, dependencies=[Depends(require_manager_above)])
def create_template(payload: settings_schemas.ProductTemplateCreate, db: Session = Depends(get_db)):
    return settings_crud.create_template(db, payload.dict())


@router.delete('/templates/{template_id}', dependencies=[Depends(require_manager_above)])
def delete_template(template_id: int, db: Session = Depends(get_db)):
    obj = settings_crud.delete_template(db, template_id)
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    return {"ok": True}


@router.get('/models', response_model=List[settings_schemas.MotorcycleModelRead], dependencies=[Depends(require_manager_above)])
def list_models(db: Session = Depends(get_db)):
    rows = settings_crud.get_models(db)
    out = []
    for r in rows:
        out.append({"id": r.id, "name": r.name, "categories": r.categories or []})
    return out



@router.get('/categories/usage', dependencies=[Depends(require_manager_above)])
def categories_usage(db: Session = Depends(get_db)):
    # return list of {id, name, count}
    rows = (
        db.query(Category.id, Category.name, func.count(Product.id))
        .outerjoin(Product, Product.category == Category.name)
        .group_by(Category.id)
        .all()
    )
    return [{"id": r[0], "name": r[1], "count": int(r[2] or 0)} for r in rows]


@router.get('/models/usage', dependencies=[Depends(require_manager_above)])
def models_usage(db: Session = Depends(get_db)):
    rows = (
        db.query(MotorcycleModel.id, MotorcycleModel.name, func.count(Product.id))
        .outerjoin(Product, Product.motorcycle_model_id == MotorcycleModel.id)
        .group_by(MotorcycleModel.id)
        .all()
    )
    return [{"id": r[0], "name": r[1], "count": int(r[2] or 0)} for r in rows]


@router.post('/models', response_model=settings_schemas.MotorcycleModelRead, dependencies=[Depends(require_manager_above)])
def create_model(payload: settings_schemas.MotorcycleModelCreate, db: Session = Depends(get_db)):
    obj = settings_crud.create_model(db, payload.name, payload.categories)
    return {"id": obj.id, "name": obj.name, "categories": obj.categories or []}


@router.delete('/models/{model_id}', dependencies=[Depends(require_manager_above)])
def delete_model(model_id: int, db: Session = Depends(get_db)):
    # prevent deleting a model that is referenced by products
    obj = db.get(settings_crud.MotorcycleModel, model_id) if hasattr(settings_crud, 'MotorcycleModel') else None
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    used = db.query(Product).filter(Product.motorcycle_model_id == model_id).first()
    if used:
        raise HTTPException(status_code=400, detail='Model is in use and cannot be deleted')
    settings_crud.delete_model(db, model_id)
    return {"ok": True}


@router.put('/models/{model_id}', response_model=settings_schemas.MotorcycleModelRead, dependencies=[Depends(require_manager_above)])
def update_model(model_id: int, payload: settings_schemas.MotorcycleModelCreate, db: Session = Depends(get_db)):
    obj = db.get(settings_crud.MotorcycleModel, model_id) if hasattr(settings_crud, 'MotorcycleModel') else None
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    # update name and categories
    obj.name = payload.name
    obj.categories = payload.categories or []
    db.commit()
    db.refresh(obj)
    return {"id": obj.id, "name": obj.name, "categories": obj.categories or []}
