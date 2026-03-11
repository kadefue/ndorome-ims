from sqlalchemy import Column, Integer, String, Text
from app.database import Base
from datetime import datetime


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)


class ProductTemplate(Base):
    __tablename__ = "product_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sku = Column(String(100), nullable=True)
    category = Column(String(100), nullable=True)
    unit_price = Column(String(40), nullable=True)
    supplier = Column(String(200), nullable=True)
    location = Column(String(50), nullable=True)


class MotorcycleModel(Base):
    __tablename__ = "motorcycle_models"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    # store raw comma-separated categories in DB but expose `categories` as list
    _categories = Column('categories', Text, nullable=True)

    @property
    def categories(self):
        raw = self._categories or ''
        if isinstance(raw, list):
            return raw
        return [c for c in (raw.split(',') if raw else []) if c]

    @categories.setter
    def categories(self, value):
        # accept list or comma-separated string
        if value is None:
            self._categories = None
        elif isinstance(value, list):
            self._categories = ','.join([str(x) for x in value])
        else:
            self._categories = str(value)
