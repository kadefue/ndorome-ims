# app/seed.py
"""
Database seeder — runs on first startup to populate the SQLite database
with realistic Ndorome Spare Parts sample data.
"""
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.crud.user import hash_password, get_user_by_email
from app.models.user import User
from app.models.product import Product
from app.models.sale import Sale
from app.models.order import Order
from app.models.delivery import Delivery


USERS = [
    {"name": "James Ndorome",  "email": "owner@ndorome.com",   "password": "owner123",   "role": "owner"},
    {"name": "Alice Mwangi",   "email": "manager@ndorome.com", "password": "manager123", "role": "manager"},
    {"name": "Brian Ochieng",  "email": "employee@ndorome.com","password": "emp123",     "role": "employee"},
]

PRODUCTS = [
    {"name": "Brake Pads - Toyota",       "sku": "BRK-TOY-001", "category": "Brakes",       "quantity": 45, "min_quantity": 10, "unit_price": 1200,  "supplier": "Toyota Parts Ltd",  "location": "A-01"},
    {"name": "Engine Oil Filter",         "sku": "OIL-FLT-002", "category": "Engine",        "quantity": 8,  "min_quantity": 15, "unit_price": 350,   "supplier": "AutoFilter Kenya",  "location": "B-02"},
    {"name": "Spark Plugs Set",           "sku": "SPK-PLG-003", "category": "Engine",        "quantity": 60, "min_quantity": 20, "unit_price": 800,   "supplier": "NGK Kenya",         "location": "C-03"},
    {"name": "Windshield Wiper Blades",   "sku": "WPR-BLD-004", "category": "Exterior",      "quantity": 30, "min_quantity": 10, "unit_price": 450,   "supplier": "Bosch Kenya",       "location": "D-04"},
    {"name": "Alternator - Nissan",       "sku": "ALT-NIS-005", "category": "Electrical",    "quantity": 5,  "min_quantity": 3,  "unit_price": 8500,  "supplier": "Nissan Parts Ltd",  "location": "E-05"},
    {"name": "Clutch Kit - Isuzu",        "sku": "CLT-ISZ-006", "category": "Transmission",  "quantity": 12, "min_quantity": 5,  "unit_price": 12000, "supplier": "Isuzu Kenya",       "location": "F-06"},
    {"name": "Air Filter - Universal",    "sku": "AIR-FLT-007", "category": "Engine",        "quantity": 25, "min_quantity": 10, "unit_price": 500,   "supplier": "AutoFilter Kenya",  "location": "B-03"},
    {"name": "Battery 12V 60Ah",          "sku": "BAT-12V-008", "category": "Electrical",    "quantity": 15, "min_quantity": 5,  "unit_price": 9500,  "supplier": "Chloride Exide",    "location": "G-07"},
    {"name": "Radiator - Toyota Hilux",   "sku": "RAD-HIL-009", "category": "Cooling",       "quantity": 6,  "min_quantity": 3,  "unit_price": 18000, "supplier": "Toyota Parts Ltd",  "location": "H-08"},
    {"name": "Shock Absorber Front Pair", "sku": "SHK-FRT-010", "category": "Suspension",    "quantity": 10, "min_quantity": 4,  "unit_price": 7500,  "supplier": "Monroe Kenya",      "location": "I-09"},
    {"name": "Timing Belt Kit",           "sku": "TMG-BLT-011", "category": "Engine",        "quantity": 3,  "min_quantity": 5,  "unit_price": 5500,  "supplier": "Gates Kenya",       "location": "C-04"},
    {"name": "Power Steering Fluid 1L",   "sku": "PSF-001-012", "category": "Fluids",        "quantity": 40, "min_quantity": 15, "unit_price": 250,   "supplier": "Castrol Kenya",     "location": "J-10"},
]


def _days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)


def seed_database(db: Session) -> None:
    # Check if already seeded
    if get_user_by_email(db, "owner@ndorome.com"):
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
        # ── Products (generate motorcycle-focused catalogue) ────────────────────
        BRANDS = [
            "TVS", "SanLG", "Boxer", "Haujue", "Sinoray",
            "Hoyun", "Zongshen", "Sanlg", "Fekon",
        ]
        PART_TYPES = [
            "Brake Pads", "Clutch Kit", "Chain", "Spark Plug", "Headlight",
            "Tire", "Seat", "Carburetor", "Piston Kit", "Cylinder Kit",
            "Gearbox Gasket", "Fuel Pump", "Handlebar", "Kick Starter",
        ]

        NUM_PRODUCTS = 60
        product_objs = []
        for i in range(NUM_PRODUCTS):
            brand = random.choice(BRANDS)
            part = random.choice(PART_TYPES)
            name = f"{brand} {part} {i+1}"
            sku = f"{brand[:3].upper()}-{i+1:04d}"
            unit_price = random.randint(800, 25000)
            min_q = random.randint(5, 20)
            location = f"S-{random.randint(1,9)}{random.randint(1,9)}"
            supplier = f"{brand} Supplies Tanzania"
            obj = Product(
                name=name, sku=sku, category="Motorcycle", quantity=0,
                min_quantity=min_q, unit_price=unit_price,
                supplier=supplier, location=location,
            )
            db.add(obj)
            product_objs.append(obj)
        db.flush()

    owner    = user_objs["owner"]
    manager  = user_objs["manager"]
    employee = user_objs["employee"]
    p        = product_objs   # shorthand

    # ── Sales ─────────────────────────────────────────────────────────────────
    sales_data = [
        (p[0], employee, 2, "John Kamau",    "Cash",          8),
        (p[2], employee, 1, "Mary Njeri",    "M-Pesa",        7),
        (p[6], employee, 3, "Peter Mutua",   "M-Pesa",        6),
        (p[5], manager,  1, "Grace Wanjiku", "Bank Transfer", 5),
        (p[7], employee, 2, "David Omondi",  "Cash",          4),
        (p[3], employee, 4, "Sarah Achieng", "M-Pesa",        3),
        (p[1], manager,  2, "Michael Otieno","Cash",          2),
        (p[9], employee, 1, "Lucy Wambui",   "M-Pesa",        1),
        (p[4], manager,  1, "Tom Kariuki",   "Bank Transfer", 0),
    ]
    for prod, emp, qty, customer, payment, days in sales_data:
        total = prod.unit_price * qty
        sale = Sale(
            product_id=prod.id, employee_id=emp.id,
            quantity=qty, unit_price=prod.unit_price, total=total,
            customer=customer, payment=payment, status="completed",
            date=_days_ago(days),
        )
        # Adjust stock retroactively (seed data already has post-sale qty in PRODUCTS)
        db.add(sale)

    # ── Purchase Orders ───────────────────────────────────────────────────────
    order1 = Order(
        product_id=p[1].id, ordered_by_id=manager.id,
        quantity=50, unit_price=280, total=14000,
        supplier="AutoFilter Kenya", status="delivered",
        expected_delivery=date.today() - timedelta(days=10),
        date=_days_ago(15),
    )
    order2 = Order(
        product_id=p[4].id, ordered_by_id=manager.id,
        quantity=10, unit_price=7000, total=70000,
        supplier="Nissan Parts Ltd", status="in_transit",
        expected_delivery=date.today() + timedelta(days=5),
        date=_days_ago(3),
    )
    order3 = Order(
        product_id=p[0].id, ordered_by_id=owner.id,
        quantity=30, unit_price=960, total=28800,
        supplier="Toyota Parts Ltd", status="pending",
        expected_delivery=date.today() + timedelta(days=7),
        date=_days_ago(1),
    )
    order4 = Order(
        product_id=p[10].id, ordered_by_id=manager.id,
        quantity=20, unit_price=4800, total=96000,
        supplier="Gates Kenya", status="pending",
        expected_delivery=date.today() + timedelta(days=10),
        date=_days_ago(0),
    )
    db.add_all([order1, order2, order3, order4])
    db.flush()

    # ── Deliveries ────────────────────────────────────────────────────────────
    delivery1 = Delivery(
        order_id=order1.id, product_id=p[1].id,
        received_by_id=employee.id, quantity=50,
        supplier="AutoFilter Kenya", status="received",
        notes="All 50 units received in good condition. No damages.",
        date=_days_ago(10),
    )
    db.add(delivery1)

    db.commit()
    print("✅ Database seeded successfully!")
    print("   Logins → owner@ndorome.com/owner123 | manager@ndorome.com/manager123 | employee@ndorome.com/emp123")
