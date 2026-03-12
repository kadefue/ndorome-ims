# app/seed.py
"""
Database seeder — runs on first startup to populate the SQLite database
with realistic Ndorome Spare Parts sample data.
"""
from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session

from app.crud.user import hash_password, get_user_by_email
from app.crud import settings as settings_crud
from app.models.user import User
from app.models.product import Product
from app.models.sale import Sale
from app.models.order import Order
from app.models.delivery import Delivery
from app.config import settings
from app.database import engine, Base
from sqlalchemy import func


USERS = [
    {"name": "Kadeghe Ndorome",  "email": "owner@ndorome.com",   "password": "owner123",   "role": "owner"},
    {"name": "Alice Mangi",   "email": "manager@ndorome.com", "password": "manager123", "role": "manager"},
    {"name": "Brian Mwalukasa",  "email": "employee@ndorome.com","password": "emp123",     "role": "employee"},
]

BRANDS = [
    "TVS", "SanLG", "Boxer", "Haojue", "Sinoray",
    "Hoyun", "Zongshen", "Sanlg", "Fekon", "Universal", "Lifan", "Loncin", "Bajaj", "Hero", "Yamaha",
]
PART_TYPES = [
    "Brake Pads", "Clutch Kit", "Chain", "Spark Plug", "Headlight",
    "Tire", "Seat", "Carburetor", "Piston Kit", "Cylinder Kit",
    "Gearbox Gasket", "Fuel Pump", "Handlebar", "Kick Starter", 
    "Wheel Rim", "Oil Filter", "Battery", "Wiper Blade", "Accessory Set", 
    "Gasket Set", "Suspension Fork", "Exhaust Pipe", "Air Filter", "Radiator", "Starter Motor",
]

# Generate PRODUCTS so the first 50 items represent delivered/approved stock
PRODUCTS = []
DELIVERED_QTY = []
NUM_PRODUCTS = 130
for i in range(NUM_PRODUCTS):
    brand = random.choice(BRANDS)
    part = random.choice(PART_TYPES)
    name = f"{part}"
    sku = f"{brand[:3].upper()}-{i+1:04d}"
    unit_price = random.randint(800, 25000)
    min_q = random.randint(5, 20)
    location = f"S-{random.randint(1,9)}{random.randint(1,9)}"
    supplier = f"{brand} Supplies Tanzania"
    # delivered_qty for first 50, zero for the rest; actual Product.quantity will be set by deliveries
    delivered = random.randint(50, 200) if i < 90 else 0
    DELIVERED_QTY.append(delivered)
    # assign a meaningful category based on part type to aid grouping/comparison
    CATEGORY_MAP = {
        "Brake": "Brakes",
        "Brake Pads": "Brakes",
        "Tire": "Tires",
        "Wheel": "Tires",
        "Clutch": "Transmission",
        "Gearbox": "Transmission",
        "Chain": "Drive",
        "Spark": "Engine",
        "Piston": "Engine",
        "Cylinder": "Engine",
        "Carburetor": "Engine",
        "Fuel": "Fuel System",
        "Oil": "Fluids",
        "Fluid": "Fluids",
        "Headlight": "Electrical",
        "Battery": "Electrical",
        "Handlebar": "Controls",
        "Seat": "Body",
        "Wiper": "Body",
        "Gasket": "Gaskets",
        "Pump": "Fuel System",
        "Starter": "Engine",
        "Accessory": "Accessories", 
        "Suspension": "Suspension",
        "Radiator": "Cooling System",
        "Exhaust": "Exhaust System",
        "Air Filter": "Air Intake",
    }
    category = "Accessories"
    for key, cat in CATEGORY_MAP.items():
        if key.lower() in part.lower():
            category = cat
            break

    PRODUCTS.append({
        "brand": brand,
        "name": name,
        "sku": sku,
        "category": category,
        "quantity": 0,
        "min_quantity": min_q,
        "unit_price": unit_price,
        "supplier": supplier,
        "location": location,
    })


def _days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)


def seed_database(db: Session) -> None:
    # If using SQLite (development), run full sample seeding as before
    if settings.DATABASE_SQLITE:
        # Check if already seeded (owner email)
        if get_user_by_email(db, "owner@ndorome.com"):
            return

        print("🌱 Seeding SQLite database with sample data...")

        # ── Users ─────────────────────────────────────────────────────────────────
        user_objs = {}
        for u in USERS:
            obj = User(
                name=u["name"], email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"], active=True,
            )
            db.add(obj)
            user_objs[u["role"]] = obj
        db.flush()

        # ── Products (create from PRODUCTS list — first 50 are delivered/approved)
        product_objs = []
        # create categories and models first
        unique_categories = sorted({p['category'] for p in PRODUCTS})
        category_map = {}
        for c in unique_categories:
            existing = [x for x in settings_crud.get_categories(db) if x.name.lower() == c.lower()]
            if existing:
                category_map[c] = existing[0]
            else:
                obj = settings_crud.create_category(db, c)
                category_map[c] = obj

        # create motorcycle models (one per brand) and map brand->model
        model_map = {}
        for br in sorted(set([p['brand'] for p in PRODUCTS])):
            # check existing
            existing = [m for m in settings_crud.get_models(db) if m.name.lower() == br.lower()]
            if existing:
                model_map[br] = existing[0]
            else:
                mobj = settings_crud.create_model(db, br, [])
                model_map[br] = mobj

        for pdef in PRODUCTS:
            # attach motorcycle_model_id based on brand
            brand = pdef.pop('brand', None)
            model_obj = model_map.get(brand)
            data = dict(pdef)
            if model_obj:
                data['motorcycle_model_id'] = model_obj.id
            obj = Product(**data)
            db.add(obj)
            product_objs.append(obj)
        db.flush()

        owner    = user_objs["owner"]
        manager  = user_objs["manager"]
        employee = user_objs["employee"]
        p        = product_objs   # shorthand

        # ── Purchase Orders (create one order per product to ensure traceability)
        orders = []
        for idx, prod in enumerate(p):
            # If this product has a planned delivered quantity, use it for the order
            planned = DELIVERED_QTY[idx] if idx < len(DELIVERED_QTY) else 0
            qty = planned if planned > 0 else random.randint(50, 200)
            order = Order(
                product_id=prod.id, ordered_by_id=manager.id,
                quantity=qty, unit_price=prod.unit_price, total=qty * prod.unit_price,
                supplier=prod.supplier, status="pending",
                expected_delivery=date.today() + timedelta(days=random.randint(1,12)),
                date=_days_ago(random.randint(1,30)),
            )
            db.add(order)
            orders.append(order)
        db.flush()

        # ── Deliveries (approve deliveries for a large subset — >40 products)
        NUM_DELIVERED = 50
        delivered_indices = list(range(NUM_DELIVERED))
        deliveries = []
        for i in delivered_indices:
            ord_obj = orders[i]
            prod = p[i]
            # delivery quantity equals ordered quantity (fully delivered)
            delivery_qty = ord_obj.quantity
            delivery = Delivery(
                order_id=ord_obj.id, product_id=prod.id,
                received_by_id=employee.id, quantity=delivery_qty,
                supplier=prod.supplier, status="approved",
                notes="Seeded delivery — approved and stocked.",
                date=_days_ago(random.randint(3,30)),
            )
            db.add(delivery)
            deliveries.append(delivery)
            # Restock product only for approved deliveries
            prod.quantity = (prod.quantity or 0) + delivery_qty
        db.flush()

        # ── Sales (create many sale records — at least 120 — only for delivered products)
        TARGET_SALES_RECORDS = 120
        sales_created = 0
        delivered_product_ids = [p[i].id for i in delivered_indices]
        # build a map id -> product obj for quick lookup
        prod_by_id = {prod.id: prod for prod in p}

        while sales_created < TARGET_SALES_RECORDS:
            prod_id = random.choice(delivered_product_ids)
            prod = prod_by_id[prod_id]
            if prod.quantity <= 0:
                # skip products without stock
                # try to find another available product
                available = [prod_by_id[x] for x in delivered_product_ids if prod_by_id[x].quantity > 0]
                if not available:
                    break
                prod = random.choice(available)
            qty = random.randint(1, 3)
            qty = min(qty, prod.quantity)
            if qty <= 0:
                continue
            total = prod.unit_price * qty
            sale = Sale(
                product_id=prod.id, employee_id=employee.id,
                quantity=qty, unit_price=prod.unit_price, total=total,
                customer=f"Customer {sales_created+1}", payment=random.choice(["Cash", "M-Pesa", "Bank Transfer"]),
                status="completed", date=_days_ago(random.randint(0,60)),
            )
            db.add(sale)
            prod.quantity -= qty
            sales_created += 1
        db.flush()

        db.commit()
        print("✅ SQLite database seeded successfully!")
        print(f"   Created {len(p)} products, {len(orders)} orders, {len(deliveries)} approved deliveries, and {sales_created} sales records.")
        print("   Logins → owner@ndorome.com/owner123 | manager@ndorome.com/manager123 | employee@ndorome.com/emp123")
        return

    # If we reach here, DATABASE_SQLITE is False → Postgres (live DB)
    # Create tables if they do not exist, but avoid deleting or mass-inserting data.
    print("🔒 Postgres detected — ensuring schema exists and performing conservative seeding checks.")
    Base.metadata.create_all(bind=engine)

    # Check users: only create users if there are no users at all, or create an owner if missing.
    user_count = db.query(User).count()
    owner_exists = db.query(User).filter(User.role == 'owner').first() is not None

    if user_count == 0:
        print("No users found in Postgres — creating default user accounts (owner/manager/employee).")
        user_objs = {}
        for u in USERS:
            # double-check email uniqueness before creating
            if get_user_by_email(db, u["email"]):
                print(f" - Skipping creation, email already exists: {u['email']}")
                continue
            obj = User(
                name=u["name"], email=u["email"],
                hashed_password=hash_password(u["password"]),
                role=u["role"], active=True,
            )
            db.add(obj)
            user_objs[u["role"]] = obj
        db.commit()
        print("✅ Created default users. Please change the default passwords in production.")
        return

    if not owner_exists:
        owner_def = USERS[0]
        existing_owner_email = get_user_by_email(db, owner_def["email"])
        if existing_owner_email:
            # An account with the intended owner email exists but is not an owner — do not modify live user records
            print(f"Found a user with the owner email ({owner_def['email']}) but it is not an owner.\nPlease create/assign an owner account manually. Skipping automatic owner creation.")
            return
        # Safe to create an owner user because no owner exists and owner email is not taken
        print("No owner user found — creating owner account.")
        obj = User(
            name=owner_def["name"], email=owner_def["email"],
            hashed_password=hash_password(owner_def["password"]),
            role=owner_def["role"], active=True,
        )
        db.add(obj)
        db.commit()
        print(f"✅ Created owner user {owner_def['email']}. Please change the password immediately.")
        return

    print("Postgres already has users including an owner; skipping seeding to protect live data.")
