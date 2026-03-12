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

## Deployment

This project serves a React/Vite frontend as static files. The production frontend build outputs to `frontend/dist/` and should be served by Nginx from a system path such as `/var/www/supafrontend`.

Frontend build and deployment (manual)

- Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

- Copy files to the server path (example, run as root or with `sudo`):

```bash
sudo rm -rf /var/www/supafrontend/*
sudo cp -r frontend/dist/* /var/www/supafrontend/
sudo chown -R www-data:www-data /var/www/supafrontend
sudo chmod -R 755 /var/www/supafrontend
```

Nginx example configuration

Place this site config in `/etc/nginx/sites-available/supafrontend` and symlink to `/etc/nginx/sites-enabled/`:

```
server {
        listen 80;
        server_name example.com; # change to your domain or IP

        root /var/www/supafrontend;
        index index.html;

        access_log /var/log/nginx/supafrontend.access.log;
        error_log  /var/log/nginx/supafrontend.error.log;

        location / {
                try_files $uri $uri/ /index.html;
        }

        # Optional: enable gzip for static assets
        gzip on;
        gzip_types text/css application/javascript application/json image/svg+xml;
}
```

After creating the config, test and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Permissions & security notes

- Ensure the web server user (commonly `www-data`) owns the files under `/var/www/supafrontend`.
- If using SELinux, apply appropriate contexts (e.g., `semanage fcontext -a -t httpd_sys_content_t '/var/www/supafrontend(/.*)?' && restorecon -R /var/www/supafrontend`).

Automating builds & updates from GitHub

There are two common, simple approaches to automate deploying updated frontend builds from GitHub:

1) GitHub Actions → SSH (recommended for small setups)

     - Create a GitHub Actions workflow that builds the frontend and copies the built files to your server using SSH/SCP or `rsync`.
     - Store `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST`, and optional `SSH_PORT` as repository secrets.

     Example workflow (save as `.github/workflows/deploy-frontend.yml`):

     ```yaml
     name: Build and Deploy Frontend

     on:
         push:
             branches: [ main ]

     jobs:
         build-and-deploy:
             runs-on: ubuntu-latest

             steps:
                 - name: Checkout
                     uses: actions/checkout@v4

                 - name: Setup Node
                     uses: actions/setup-node@v4
                     with:
                         node-version: '22'

                 - name: Install and Build
                     working-directory: frontend
                     run: |
                         npm ci
                         npm run build

                 - name: Deploy to server with rsync
                     env:
                         SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
                         SSH_USER: ${{ secrets.SSH_USER }}
                         SSH_HOST: ${{ secrets.SSH_HOST }}
                         SSH_PORT: ${{ secrets.SSH_PORT || '22' }}
                     run: |
                         mkdir -p ~/.ssh
                         echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
                         chmod 600 ~/.ssh/id_rsa
                         ssh-keyscan -p $SSH_PORT $SSH_HOST >> ~/.ssh/known_hosts || true
                        rsync -avz -e "ssh -p $SSH_PORT -i ~/.ssh/id_rsa" frontend/dist/ $SSH_USER@$SSH_HOST:/var/www/supafrontend/
     ```

     - Pros: simple, secure (when using key auth), builds on GitHub runners.
     - Cons: requires SSH access from CI to server.

2) Server-side webhook + pull script

    - Run a small deploy script on the server that pulls the repository, builds, and copies files to `/var/www/supafrontend`.
     - Trigger that script with a GitHub webhook (POST) to a small HTTP listener (or use `git` + `post-receive` hooks if pushing to a bare repo on the server).

     Example minimal server script (`/usr/local/bin/deploy-ndorome.sh`):

     ```bash
     #!/usr/bin/env bash
     set -e
     cd /home/deploy/ndorome-ims || exit 1
     git fetch --all
     git reset --hard origin/main
     cd frontend
     npm ci
     npm run build
    sudo rm -rf /var/www/supafrontend/*
    sudo cp -r dist/* /var/www/supafrontend/
    sudo chown -R www-data:www-data /var/www/supafrontend
     sudo systemctl reload nginx
     ```

     - Protect the webhook endpoint (shared secret, IP allowlist, or use a tool like `git-php-deploy`, `webhook` by `adnanh`, or `ngrok` for dev).

Which method to choose

- For small teams or straightforward setups, GitHub Actions → rsync is easiest and requires no additional server services.
- For more control on the server (e.g., building server-side or complex deployment steps), use the webhook + server-side script approach.

If you'd like, I can add the GitHub Actions workflow file and an example Nginx site file into this repo — tell me which option you prefer.

---

## Tech Stack

Backend: FastAPI · Uvicorn · SQLAlchemy 2.0 · Alembic  
Frontend: React 18 · Vite · Recharts

---

## License

MIT License — free to use, modify, and distribute.
