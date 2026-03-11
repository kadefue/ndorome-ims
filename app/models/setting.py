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
    # comma-separated category list for simplicity
    categories = Column(Text, nullable=True)
