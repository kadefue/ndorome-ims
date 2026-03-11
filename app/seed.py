# app/seed.py
"""
Database seeder — runs on first startup to populate the SQLite database
with realistic Supa Kariakoo Spare Parts Centre sample data.

Important: products are created with `quantity=0` and any initial stock
is added by creating purchase `Order` records and `Delivery` entries that
are immediately approved. This ensures inventory always originates from
approved deliveries.
"""
from datetime import datetime, date, timedelta
import random
from sqlalchemy.orm import Session

from app.crud.user import hash_password, get_user_by_email
from app.models.user import User
from app.models.product import Product
from app.models.sale import Sale
from app.models.order import Order
from app.models.delivery import Delivery

# Use CRUD helpers so deliveries are approved via the canonical path
from app.crud.order import create_order
from app.crud.delivery import create_delivery, approve_delivery
from app.schemas.order import OrderCreate
from app.schemas.delivery import DeliveryCreate
from app.crud.sale import create_sale
from app.schemas.sale import SaleCreate


USERS = [
    {"name": "James Kariakoo",  "email": "owner@supakariakoo.com",   "password": "owner123",   "role": "owner"},
    {"name": "Alice Mangi",    "email": "manager@supakariakoo.com", "password": "manager123", "role": "manager"},
    {"name": "Brian Mwalukasa",   "email": "employee@supakariakoo.com","password": "emp123",     "role": "employee"},
]

## Generate 50 motorcycle-related parts commonly found in Tanzania
PART_BASE = [
    ("Brake Pads", "Brakes"), ("Clutch Kit", "Transmission"), ("Spark Plugs", "Engine"),
    ("Air Filter", "Engine"), ("Oil Filter", "Engine"), ("Battery 12V", "Electrical"),
    ("Headlight", "Electrical"), ("Taillight", "Electrical"), ("Mirror", "Exterior"),
    ("Chain", "Drive"), ("Sprocket", "Drive"), ("Tire", "Wheels"), ("Tube", "Wheels"),
    ("Shock Absorber", "Suspension"), ("Fork Seal", "Suspension"), ("Brake Shoe", "Brakes"),
    ("Brake Disc", "Brakes"), ("Carburetor", "Fuel"), ("Fuel Tap", "Fuel"), ("Seat", "Body"),
    ("Handlebar", "Controls"), ("Brake Lever", "Controls"), ("Clutch Cable", "Controls"),
    ("Speedometer Cable", "Controls"), ("Ignition Coil", "Electrical"), ("Regulator Rectifier", "Electrical"),
    ("CDI Unit", "Electrical"), ("Piston Ring", "Engine"), ("Gasket Set", "Engine"), ("Valve", "Engine"),
    ("Wheel Bearing", "Wheels"), ("Rim", "Wheels"), ("Starter Motor", "Electrical"), ("Oil Seal", "Engine"),
]

SUPPLIERS = ["MotoParts TZ", "DarBike Supplies", "Kilimanjaro Motors", "Zanzibar Motors", "Nairobi Moto" ]

PRODUCTS = []
for i in range(50):
    base, category = random.choice(PART_BASE)
    model = f"{base} - Model {random.randint(100,999)}"
    sku = f"MOTO-{i+1:03d}-{random.randint(100,999)}"
    qty = random.randint(0, 100)
    min_q = random.choice([3,5,10,15])
    price = round(random.uniform(1500, 35000), 2)  # TZS or KES assumed
    supplier = random.choice(SUPPLIERS)
    location = f"R-{random.randint(1,20):02d}"
    PRODUCTS.append({
        "name": model,
        "sku": sku,
        "category": category,
        "quantity": qty,
        "min_quantity": min_q,
        "unit_price": price,
        "supplier": supplier,
        "location": location,
    })


def _days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)


def seed_database(db: Session) -> None:
    # Check if already seeded
    if get_user_by_email(db, "owner@supakariakoo.com"):
        return

    print("🌱 Seeding database with sample data...")

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

    # ── Products ──────────────────────────────────────────────────────────────
    # Create products with quantity=0. Any intended initial stock from the
    # PRODUCTS table is applied via approved deliveries below so that all
    # inventory originates from an order + approved delivery.
    product_objs = []
    intended_stocks: list[tuple[Product,int]] = []
    for p in PRODUCTS:
        intended_qty = p.get("quantity", 0)
        p_copy = p.copy()
        p_copy["quantity"] = 0
        obj = Product(**p_copy)
        db.add(obj)
        product_objs.append(obj)
        intended_stocks.append((obj, intended_qty))
    db.flush()

    owner    = user_objs["owner"]
    manager  = user_objs["manager"]
    employee = user_objs["employee"]
    p        = product_objs   # shorthand

    # ── Sales (seed will create 50 sales after initial stock is applied)
    # We'll create these later once products have been restocked via approved deliveries.

    # Apply intended initial stock via orders + approved deliveries
    for prod_obj, qty in intended_stocks:
        if not qty or qty <= 0:
            continue
        # Create a lightweight order and delivery, then approve it
        try:
            order_in = OrderCreate(
                product_id=prod_obj.id,
                quantity=qty,
                unit_price=prod_obj.unit_price,
                supplier=prod_obj.supplier,
            )
            order = create_order(db, order_in, ordered_by_id=manager.id)

            delivery_in = DeliveryCreate(
                order_id=order.id,
                product_id=prod_obj.id,
                quantity=qty,
                supplier=prod_obj.supplier,
                notes="Seed: initial stock via approved delivery",
            )
            delivery = create_delivery(db, delivery_in, received_by_id=employee.id)
            approve_delivery(db, delivery.id, approver_id=manager.id)
        except Exception:
            # If anything fails here, continue seeding other products
            continue
    # ── Generate additional purchase orders (45+) to populate history
    additional_orders = 45
    created_orders = 0
    for _ in range(additional_orders):
        prod = random.choice(product_objs)
        qty = random.randint(1, 80)
        unit_price = round(max(100, prod.unit_price * random.uniform(0.8, 1.4)), 2)
        try:
            o_in = OrderCreate(product_id=prod.id, quantity=qty, unit_price=unit_price, supplier=prod.supplier)
            order = create_order(db, o_in, ordered_by_id=random.choice([manager.id, owner.id]))
            created_orders += 1
            # Decide delivery status: 60% delivered (create + approve), 20% in_transit, rest pending
            r = random.random()
            if r < 0.6:
                d_in = DeliveryCreate(order_id=order.id, product_id=prod.id, quantity=qty, supplier=prod.supplier, notes="Seed delivery")
                d = create_delivery(db, d_in, received_by_id=employee.id)
                approve_delivery(db, d.id, approver_id=manager.id)
            elif r < 0.8:
                # mark in_transit
                try:
                    order_obj = db.query(Order).filter(Order.id == order.id).first()
                    if order_obj:
                        order_obj.status = "in_transit"
                        db.commit()
                except Exception:
                    pass
        except Exception:
            continue

    # ── Create 50 sales (consume stock). Try until we have 50 successful sales or reach attempts limit.
    sales_to_create = 50
    created_sales = 0
    attempts = 0
    max_attempts = 500
    payments = ["Cash", "M-Pesa", "Bank Transfer"]
    while created_sales < sales_to_create and attempts < max_attempts:
        attempts += 1
        prod = random.choice(product_objs)
        # Refresh product from DB to get current quantity
        prod_db = db.query(Product).filter(Product.id == prod.id).first()
        if not prod_db or prod_db.quantity <= 0:
            continue
        qty = random.randint(1, min(5, prod_db.quantity))
        sale_in = SaleCreate(product_id=prod_db.id, quantity=qty, customer=f"Customer {random.randint(1000,9999)}", payment=random.choice(payments))
        try:
            create_sale(db, sale_in, employee_id=random.choice([employee.id, manager.id]))
            created_sales += 1
        except Exception:
            continue

    print(f"✅ Database seeded successfully! Created {len(product_objs)} products, {created_orders} extra orders, and {created_sales} sales.")
    print("   Logins → owner@supakariakoo.com/owner123 | manager@supakariakoo.com/manager123 | employee@supakariakoo.com/emp123")
