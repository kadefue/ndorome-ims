# 🔧 Supa Kariakoo Spare Parts Centre — Inventory Management System

A full-stack **Inventory Management System** for Supa Kariakoo Spare Parts Centre. Covers stock tracking, sales recording, purchase orders, and delivery management — with role-based access for owners, managers, and employees.

**Backend:** FastAPI · SQLAlchemy 2.0 · SQLite · Alembic · JWT Auth  
**Frontend:** React 18 · Recharts · Vite

---

## Features

- **Dashboard** — KPI cards, monthly revenue chart, stock-by-category pie chart, low-stock alerts
- **Inventory** — Full CRUD for products with stock level indicators and SKU management
- **Sales** — Record sales with automatic stock deduction and price snapshotting
- **Purchase Orders** — Create and track orders through `pending → in_transit → delivered`
- **Deliveries** — Receive stock, automatically restock inventory and close linked orders
- **Reports** — Revenue trends, payment breakdown, category distribution
- **User Management** — Role-gated user creation (Owner / Manager / Employee)
- **JWT Authentication** — Secure token-based auth with role enforcement on every endpoint

---

## Project Structure

```
ndorome-ims/
│
├── main.py                    # FastAPI entry point
├── requirements.txt
├── alembic.ini
├── .env.example
│
├── app/
# 🔧 Supa Kariakoo Spare Parts Centre — Inventory Management System

A full-stack Inventory Management System for Supa Kariakoo Spare Parts Centre. It supports stock tracking, sales recording, purchase orders, delivery approval, and role-based access for owners, managers, and employees.

Stack overview:
- Backend: FastAPI · SQLAlchemy 2.0 · SQLite · Alembic · JWT Auth
- Frontend: React 18 · Vite · Recharts

This README includes step-by-step setup for development on macOS using Python 3.11 and Node 22.

---

## Features

- Dashboard: KPI cards, monthly revenue chart, stock-by-category pie, low-stock alerts
- Inventory: product CRUD with SKU and low-stock indicators
- Sales: record sales with automatic stock adjustments
- Purchase Orders: create & track orders (pending → in_transit → delivered)
- Deliveries: record incoming deliveries; manager approves to restock
- Users & Roles: Owner / Manager / Employee with role-based permissions

---

## Project Structure

```
ndorome-ims/
│
├── main.py                    # FastAPI entry point
├── requirements.txt
├── alembic.ini
├── .env.example
│
├── app/
│   ├── config.py
│   ├── database.py
│   ├── auth.py
│   ├── seed.py
│   ├── models/
│   ├── schemas/
│   ├── crud/
│   └── routers/
│
├── alembic/versions/          # DB migration scripts
└── frontend/
    ├── src/App.jsx            # Single-file React app (monolithic)
    └── package.json
```

---

## Getting Started (Development)

Prerequisites

- Python 3.11 installed and on PATH
- Node.js 22 and npm installed (use `nvm` to manage Node versions)

Backend (Python 3.11)

```bash
git clone https://github.com/YOUR_USERNAME/ndorome-ims.git
cd ndorome-ims

# Create and activate Python 3.11 venv
python3.11 -m venv ./venv
source ./venv/bin/activate

# Install Python deps
pip install -r requirements.txt

# Copy example env and edit values (DATABASE_URL, SECRET_KEY, etc.)
cp .env.example .env
# You can leave DATABASE_URL as the default sqlite:///./ndorome_ims.db for local dev

# (Optional) Apply Alembic migrations if you prefer managed migrations
# alembic upgrade head

# Start the API server (dev)
./venv/bin/uvicorn main:app --reload --port 8000
```

Notes:
- API base: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

Frontend (Node 22)

```bash
cd frontend
npm install
npm run dev
```

Frontend dev UI: http://localhost:5173

Production build example

```bash
cd frontend
npm run build
# Serve the `dist/` folder from a static host or integrate with your backend
```

---

## Environment & Configuration

The project uses `app/config.py` (Pydantic settings). By default the app reads `.env`. The important settings:

- `DATABASE_URL` — connection string (defaults to `sqlite:///./ndorome_ims.db`)
- `SECRET_KEY` — JWT secret (change in production)
- `CORS_ORIGINS` — allowed origins for frontend in development

Copy `.env.example` to `.env` and update values before deploying.

---

## Database Migrations (Alembic)

```bash
# Create migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply migrations
alembic upgrade head

# Roll back
alembic downgrade -1
```

If you are using the default SQLite dev DB the app will also create `ndorome_ims.db` when started.

---

## Default Credentials (Dev)

| Role     | Email                   | Password  |
|----------|-------------------------|-----------|
| Owner    | owner@supakariakoo.com       | owner123  |
| Manager  | manager@supakariakoo.com     | manager123|
| Employee | employee@supakariakoo.com    | emp123    |

Change these before production.

---

## Recommendations / Production Notes

- Replace the default `SECRET_KEY` in `.env`.
- Use Postgres in production: set `DATABASE_URL=postgresql://user:pass@host/dbname` and run migrations.
- Add DB-level UNIQUE constraints on `products.sku` and `products.name` before deploying (recommended).
- Run the backend under a process manager (systemd / Docker / supervisor) and serve the frontend as static files behind Nginx.

---

## Tech Stack

Backend: FastAPI · Uvicorn · SQLAlchemy 2.0 · Alembic  
Frontend: React 18 · Vite · Recharts

---

## License

MIT License — free to use, modify, and distribute.
