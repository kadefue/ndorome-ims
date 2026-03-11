from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import require_manager_above
from app.crud import settings as settings_crud
from app.schemas import settings as settings_schemas

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
    obj = settings_crud.delete_category(db, category_id)
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    return {"ok": True}


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
    # convert comma-separated categories to list
    out = []
    for r in rows:
        cats = r.categories.split(',') if r.categories else []
        out.append({"id": r.id, "name": r.name, "categories": [c for c in cats if c]})
    return out


@router.post('/models', response_model=settings_schemas.MotorcycleModelRead, dependencies=[Depends(require_manager_above)])
def create_model(payload: settings_schemas.MotorcycleModelCreate, db: Session = Depends(get_db)):
    obj = settings_crud.create_model(db, payload.name, payload.categories)
    return {"id": obj.id, "name": obj.name, "categories": payload.categories}


@router.delete('/models/{model_id}', dependencies=[Depends(require_manager_above)])
def delete_model(model_id: int, db: Session = Depends(get_db)):
    obj = settings_crud.delete_model(db, model_id)
    if not obj:
        raise HTTPException(status_code=404, detail='Not found')
    return {"ok": True}
