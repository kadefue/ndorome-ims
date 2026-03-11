from sqlalchemy.orm import Session
from typing import List

from app.models.setting import Category, ProductTemplate, MotorcycleModel


def get_categories(db: Session) -> List[Category]:
    return db.query(Category).order_by(Category.name).all()


def create_category(db: Session, name: str) -> Category:
    obj = Category(name=name)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_category(db: Session, category_id: int):
    obj = db.get(Category, category_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


def get_templates(db: Session) -> List[ProductTemplate]:
    return db.query(ProductTemplate).order_by(ProductTemplate.name).all()


def create_template(db: Session, data: dict) -> ProductTemplate:
    obj = ProductTemplate(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_template(db: Session, template_id: int):
    obj = db.get(ProductTemplate, template_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj


def get_models(db: Session) -> List[MotorcycleModel]:
    return db.query(MotorcycleModel).order_by(MotorcycleModel.name).all()


def create_model(db: Session, name: str, categories: List[str]) -> MotorcycleModel:
    obj = MotorcycleModel(name=name)
    obj.categories = categories or []
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_model(db: Session, model_id: int):
    obj = db.get(MotorcycleModel, model_id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
