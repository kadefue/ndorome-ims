# 🔧 Ndorome Spare Parts — Inventory Management System

A full-stack **Inventory Management System** for Ndorome Spare Parts. Covers stock tracking, sales recording, purchase orders, and delivery management — with role-based access for owners, managers, and employees.

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
│   ├── config.py              # Settings via pydantic-settings (.env support)
│   ├── database.py            # SQLAlchemy engine, SessionLocal, Base, get_db()
│   ├── auth.py                # JWT helpers + role-gate dependencies
│   ├── seed.py                # One-time seeder (skips if data exists)
│   │
│   ├── models/                # SQLAlchemy ORM — one file per table
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── order.py
│   │   └── delivery.py
│   │
│   ├── schemas/               # Pydantic v2 request/response contracts
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── order.py
│   │   ├── delivery.py
│   │   └── dashboard.py
│   │
│   ├── crud/                  # All DB queries — no SQL in routers
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── sale.py
│   │   ├── order.py
│   │   └── delivery.py
│   │
│   └── routers/               # Thin route handlers — delegate to crud/
│       ├── auth.py
│       ├── products.py
│       ├── sales.py
│       ├── orders.py
│       ├── deliveries.py
│       └── dashboard.py
│
├── alembic/versions/          # Database migration scripts
│
└── frontend/
    ├── App.jsx                # Full React application (single file)
    └── README.md
```

---

## Getting Started

### Backend

```bash
git clone https://github.com/YOUR_USERNAME/ndorome-ims.git
cd ndorome-ims

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # Edit .env — change SECRET_KEY before deploying

uvicorn main:app --reload --port 8000
```

The server creates `ndorome_ims.db` and seeds sample data automatically on first run.

- **API:** http://localhost:8000  
- **Interactive Docs:** http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm create vite@latest . -- --template react
npm install && npm install recharts
# Replace src/App.jsx with frontend/App.jsx
npm run dev
```

Frontend: http://localhost:5173

---

## Default Credentials

| Role     | Email                   | Password     |
|----------|-------------------------|--------------|
| Owner    | owner@ndorome.com       | owner123     |
| Manager  | manager@ndorome.com     | manager123   |
| Employee | employee@ndorome.com    | emp123       |

> Change all passwords before deploying to production.

---

## Role Permissions

| Feature                      | Owner | Manager | Employee |
|------------------------------|:-----:|:-------:|:--------:|
| Dashboard & Reports          | ✅    | ✅      | ✅       |
| View Inventory               | ✅    | ✅      | ✅       |
| Add / Edit / Delete Products | ✅    | ✅      | ❌       |
| Record Sales                 | ✅    | ✅      | ✅       |
| View All Sales               | ✅    | ✅      | Own only |
| Create Purchase Orders       | ✅    | ✅      | ❌       |
| Update Order Status          | ✅    | ✅      | ❌       |
| Record Deliveries            | ✅    | ✅      | ❌       |
| Manage Users                 | ✅    | ✅      | ❌       |
| Create Owner Accounts        | ✅    | ❌      | ❌       |

---

## Database Migrations

```bash
# Generate a migration after changing a model
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

---

## Switching to PostgreSQL

Update `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ndorome_ims
```

Then run `alembic upgrade head`. No code changes required.

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Backend    | FastAPI 0.104, Uvicorn                        |
| ORM        | SQLAlchemy 2.0 (declarative)                  |
| Database   | SQLite (WAL mode, FK constraints enforced)    |
| Migrations | Alembic 1.12                                  |
| Auth       | JWT (python-jose), bcrypt (passlib)           |
| Validation | Pydantic v2, pydantic-settings                |
| Frontend   | React 18, Recharts, Vite                      |
| Styling    | Custom CSS — Syne + DM Sans, dark theme       |

---

## License

MIT License — free to use, modify, and distribute.
