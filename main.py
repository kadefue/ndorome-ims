# main.py  —  Application entry point
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from sqlalchemy import text
from app.seed import seed_database

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

from app.routers import auth, products, sales, orders, deliveries, dashboard, settings as settings_router


# ── Lifespan (replaces deprecated on_event startup/shutdown) ──────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    # Create all tables (safe if they already exist)
    Base.metadata.create_all(bind=engine)

    # Seed the DB with sample data on first run
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Lightweight in-place migration: add new sale columns if they don't exist.
    # This avoids failing when the code expects `customer_email`/`customer_phone`.
    with engine.connect() as conn:
        try:
            rows = conn.execute(text("PRAGMA table_info('sales')")).fetchall()
            col_names = [r[1] for r in rows]
            if 'customer_email' not in col_names:
                conn.execute(text("ALTER TABLE sales ADD COLUMN customer_email VARCHAR(150)"))
            if 'customer_phone' not in col_names:
                conn.execute(text("ALTER TABLE sales ADD COLUMN customer_phone VARCHAR(50)"))
        except Exception:
            # If anything goes wrong here, continue — app will still run and surface errors.
            pass

    yield  # Application runs here

    # ── Shutdown ──
    # Nothing needed for SQLite; connection pool is cleaned up automatically


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Inventory Management System for Supa Kariakoo Spare Parts Centre. "
        "Manage stock, sales, purchase orders and deliveries with role-based access control."
    ),
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],  # Restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(orders.router)
app.include_router(deliveries.router)
app.include_router(settings_router.router)


# ── Root health-check ─────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
