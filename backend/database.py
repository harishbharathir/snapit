import os
import hashlib
import secrets
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB_NAME", "snapit_db")

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None

def get_client() -> AsyncIOMotorClient:
    global client
    if client is None:
        client = AsyncIOMotorClient(MONGODB_URI)
    return client

def get_database() -> AsyncIOMotorDatabase:
    global db
    if db is None:
        db = get_client()[DB_NAME]
    return db

@asynccontextmanager
async def get_db():
    yield get_database()

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return f"{salt}${pw_hash}"

def verify_password(plain_password: str, stored_password: str) -> bool:
    if not stored_password:
        return False
    if "$" not in stored_password:
        # Legacy plain password support
        return plain_password == stored_password
    salt, pw_hash = stored_password.split("$", 1)
    test_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return secrets.compare_digest(pw_hash, test_hash)

async def init_db():
    database = get_database()
    
    # 1. Setup Indexes
    await database.users.create_index("username", unique=True)
    await database.users.create_index("email", unique=True, sparse=True)
    await database.users.create_index("id", unique=True)
    await database.canteens.create_index("id", unique=True)
    await database.menu_items.create_index("id", unique=True)
    await database.menu_items.create_index([("canteen_id", 1), ("category", 1)])
    await database.orders.create_index("id", unique=True)
    await database.orders.create_index([("canteen_id", 1), ("status", 1)])
    await database.orders.create_index([("student_id", 1), ("created_at", -1)])
    await database.crowd_zone_data.create_index([("canteen_id", 1), ("timestamp", -1)])

    # 2. Seed / Ensure Canteens
    canteen_count = await database.canteens.count_documents({})
    if canteen_count == 0:
        canteens = [
            {'id': 'A', 'name': 'Main Canteen', 'location': 'Central Block', 'image_url': '/images/canteen_a.jpg', 'status': 'OPEN'},
            {'id': 'B', 'name': 'Food Court', 'location': 'East Wing', 'image_url': '/images/canteen_b.jpg', 'status': 'OPEN'},
            {'id': 'C', 'name': 'Snack Corner', 'location': 'Library Block', 'image_url': '/images/canteen_c.jpg', 'status': 'OPEN'}
        ]
        await database.canteens.insert_many(canteens)

    # 3. Seed / Ensure Menu Items
    menu_count = await database.menu_items.count_documents({})
    if menu_count == 0:
        menu = [
            {'id': 1, 'canteen_id': 'A', 'name': 'Dosa', 'description': 'Crispy plain dosa', 'price': 40.0, 'category': 'South Indian', 'image_url': '/images/food_dosa.jpg', 'available': True, 'inventory': 50, 'is_special': False},
            {'id': 2, 'canteen_id': 'A', 'name': 'Special Paneer Dosa', 'description': 'Spicy paneer filling', 'price': 80.0, 'category': 'South Indian', 'image_url': '/images/food_paneer_dosa.jpg', 'available': True, 'inventory': 20, 'is_special': True},
            {'id': 3, 'canteen_id': 'A', 'name': 'Idli', 'description': 'Soft idli with sambar', 'price': 30.0, 'category': 'South Indian', 'image_url': '/images/food_idli.jpg', 'available': True, 'inventory': 100, 'is_special': False},
            {'id': 4, 'canteen_id': 'A', 'name': 'Fried Rice', 'description': 'Veg fried rice', 'price': 80.0, 'category': 'Chinese', 'image_url': '/images/food_fried_rice.jpg', 'available': True, 'inventory': 40, 'is_special': False},
            {'id': 5, 'canteen_id': 'B', 'name': 'Burger', 'description': 'Veg burger with fries', 'price': 100.0, 'category': 'Snacks', 'image_url': '/images/food_burger.jpg', 'available': True, 'inventory': 30, 'is_special': False},
            {'id': 6, 'canteen_id': 'B', 'name': 'Special Pizza', 'description': 'Cheese burst pizza', 'price': 150.0, 'category': 'Snacks', 'image_url': '/images/food_pizza.jpg', 'available': True, 'inventory': 15, 'is_special': True},
            {'id': 7, 'canteen_id': 'B', 'name': 'Cold Coffee', 'description': 'Thick cold coffee', 'price': 60.0, 'category': 'Beverages', 'image_url': '/images/food_cold_coffee.jpg', 'available': True, 'inventory': 50, 'is_special': False},
            {'id': 8, 'canteen_id': 'C', 'name': 'Samosa', 'description': 'Crispy potato samosa', 'price': 15.0, 'category': 'Snacks', 'image_url': '/images/food_samosa.jpg', 'available': True, 'inventory': 60, 'is_special': False},
            {'id': 9, 'canteen_id': 'C', 'name': 'Tea', 'description': 'Masala chai', 'price': 10.0, 'category': 'Beverages', 'image_url': '/images/food_tea.jpg', 'available': True, 'inventory': 100, 'is_special': False},
            {'id': 10, 'canteen_id': 'C', 'name': 'Special Brownie', 'description': 'Hot chocolate brownie', 'price': 90.0, 'category': 'Snacks', 'image_url': '/images/food_brownie.jpg', 'available': True, 'inventory': 25, 'is_special': True}
        ]
        await database.menu_items.insert_many(menu)

    # 4. Seed / Ensure Users
    user_count = await database.users.count_documents({})
    if user_count == 0:
        seed_users = [
            {
                'id': 'student1',
                'username': 'Harish',
                'email': 'harish@snapit.edu',
                'password': hash_password('password'),
                'role': 'student',
                'wallet_balance': 500.0,
                'canteen_id': None,
                'created_at': datetime.now()
            },
            {
                'id': 'staffA',
                'username': 'CounterA',
                'email': 'countera@snapit.edu',
                'password': hash_password('password'),
                'role': 'staff',
                'wallet_balance': 0.0,
                'canteen_id': 'A',
                'created_at': datetime.now()
            },
            {
                'id': 'staffB',
                'username': 'CounterB',
                'email': 'counterb@snapit.edu',
                'password': hash_password('password'),
                'role': 'staff',
                'wallet_balance': 0.0,
                'canteen_id': 'B',
                'created_at': datetime.now()
            },
            {
                'id': 'admin1',
                'username': 'Admin',
                'email': 'admin@snapit.edu',
                'password': hash_password('password'),
                'role': 'admin',
                'wallet_balance': 0.0,
                'canteen_id': None,
                'created_at': datetime.now()
            }
        ]
        await database.users.insert_many(seed_users)

    # 5. Optional SQLite to MongoDB migration for existing orders if empty
    orders_count = await database.orders.count_documents({})
    sqlite_path = os.path.join(os.path.dirname(__file__), 'campus_food.db')
    if orders_count == 0 and os.path.exists(sqlite_path):
        try:
            import sqlite3
            conn = sqlite3.connect(sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Fetch orders
            cursor.execute("SELECT * FROM orders")
            rows = cursor.fetchall()
            if rows:
                migrated_orders = []
                for r in rows:
                    oid = r['id']
                    cursor.execute('''
                        SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, m.name as item_name, m.category 
                        FROM order_items oi
                        LEFT JOIN menu_items m ON oi.menu_item_id = m.id
                        WHERE oi.order_id = ?
                    ''', (oid,))
                    items = [dict(ir) for ir in cursor.fetchall()]
                    
                    order_dict = dict(r)
                    order_dict['items'] = items
                    # parse created_at
                    try:
                        if isinstance(order_dict.get('created_at'), str):
                            order_dict['created_at'] = datetime.fromisoformat(order_dict['created_at'].replace(' ', 'T'))
                    except Exception:
                        order_dict['created_at'] = datetime.now()
                        
                    migrated_orders.append(order_dict)
                if migrated_orders:
                    await database.orders.insert_many(migrated_orders)
            conn.close()
        except Exception as e:
            print(f"Notice: SQLite to MongoDB orders migration skipped: {e}")
