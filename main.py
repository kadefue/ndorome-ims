# main.py  —  Application entry point
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database

# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401

from app.routers import auth, products, sales, orders, deliveries, dashboard


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

    yield  # Application runs here

    # ── Shutdown ──
    # Nothing needed for SQLite; connection pool is cleaned up automatically


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Inventory Management System for Ndorome Spare Parts. "
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
