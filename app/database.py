# app/database.py
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# SQLite engine with WAL mode for better concurrency
if settings.DATABASE_SQLITE:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI threading
        echo=settings.DEBUG,                         # Log SQL queries in DEBUG mode
    )
else:
    # PostgreSQL engine (no special connect_args needed)
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True
    )

# Enable WAL journal mode and foreign keys for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base class for all ORM models
class Base(DeclarativeBase):
    pass


# Dependency — yields a DB session and ensures it's closed after the request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
