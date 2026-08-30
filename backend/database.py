import aiosqlite
import os
from contextlib import asynccontextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), 'campus_food.db')

@asynccontextmanager
async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    async with get_db() as db:
        # Create users table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                password TEXT,
                role TEXT,
                wallet_balance REAL DEFAULT 0,
                canteen_id TEXT
            )
        ''')
        
        await db.execute('''
            CREATE TABLE IF NOT EXISTS canteens (
                id TEXT PRIMARY KEY,
                name TEXT,
                location TEXT,
                image_url TEXT,
                status TEXT DEFAULT 'OPEN'
            )
        ''')

        await db.execute('''
            CREATE TABLE IF NOT EXISTS menu_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canteen_id TEXT,
                name TEXT,
                description TEXT,
                price REAL,
                category TEXT,
                image_url TEXT,
                available BOOLEAN DEFAULT 1,
                inventory INTEGER DEFAULT 50,
                is_special BOOLEAN DEFAULT 0,
                FOREIGN KEY (canteen_id) REFERENCES canteens (id)
            )
        ''')

        await db.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                canteen_id TEXT,
                student_id TEXT,
                student_name TEXT,
                total_amount REAL,
                status TEXT DEFAULT 'PENDING',
                qr_code TEXT,
                qr_code_tea TEXT,
                qr_code_snacks TEXT,
                tea_status TEXT DEFAULT 'PENDING',
                snacks_status TEXT DEFAULT 'PENDING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (canteen_id) REFERENCES canteens (id)
            )
        ''')

        await db.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT,
                menu_item_id INTEGER,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
            )
        ''')

        await db.execute('''
            CREATE TABLE IF NOT EXISTS crowd_zone_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canteen_id TEXT,
                zone_id TEXT,
                zone_name TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                people_count INTEGER,
                occupancy_percentage REAL,
                zone_status TEXT
            )
        ''')

        await db.execute('''
            CREATE TABLE IF NOT EXISTS zone_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                canteen_id TEXT,
                zone_id TEXT,
                zone_name TEXT,
                x INTEGER,
                y INTEGER,
                width INTEGER,
                height INTEGER,
                capacity INTEGER
            )
        ''')
        # Run migrations to add new columns to orders if the DB already exists
        for col, col_type in [
            ("qr_code_tea", "TEXT"), 
            ("qr_code_snacks", "TEXT"), 
            ("tea_status", "TEXT DEFAULT 'PENDING'"), 
            ("snacks_status", "TEXT DEFAULT 'PENDING'")
        ]:
            try:
                await db.execute(f"ALTER TABLE orders ADD COLUMN {col} {col_type}")
            except Exception:
                pass

        await db.commit()

        # Seed Users
        await db.execute("INSERT OR IGNORE INTO users (id, username, password, role, wallet_balance) VALUES ('student1', 'Harish', 'password', 'student', 500)")
        await db.execute("INSERT OR IGNORE INTO users (id, username, password, role, canteen_id) VALUES ('staffA', 'CounterA', 'password', 'staff', 'A')")
        await db.execute("INSERT OR IGNORE INTO users (id, username, password, role, canteen_id) VALUES ('staffB', 'CounterB', 'password', 'staff', 'B')")
        await db.execute("INSERT OR IGNORE INTO users (id, username, password, role) VALUES ('admin1', 'Admin', 'password', 'admin')")

        # Seed Canteens
        canteens = [
            ('A', 'Main Canteen', 'Central Block', '/images/canteen_a.jpg'),
            ('B', 'Food Court', 'East Wing', '/images/canteen_b.jpg'),
            ('C', 'Snack Corner', 'Library Block', '/images/canteen_c.jpg')
        ]
        for c in canteens:
            await db.execute("INSERT OR IGNORE INTO canteens (id, name, location, image_url) VALUES (?, ?, ?, ?)", c)

        # Seed Menu Items (with inventory and is_special)
        async with db.execute("SELECT COUNT(*) FROM menu_items") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                menu = [
                    ('A', 'Dosa', 'Crispy plain dosa', 40.0, 'South Indian', '/images/food_dosa.jpg', 50, 0),
                    ('A', 'Special Paneer Dosa', 'Spicy paneer filling', 80.0, 'South Indian', '/images/food_paneer_dosa.jpg', 20, 1),
                    ('A', 'Idli', 'Soft idli with sambar', 30.0, 'South Indian', '/images/food_idli.jpg', 100, 0),
                    ('A', 'Fried Rice', 'Veg fried rice', 80.0, 'Chinese', '/images/food_fried_rice.jpg', 40, 0),
                    ('B', 'Burger', 'Veg burger with fries', 100.0, 'Snacks', '/images/food_burger.jpg', 30, 0),
                    ('B', 'Special Pizza', 'Cheese burst pizza', 150.0, 'Snacks', '/images/food_pizza.jpg', 15, 1),
                    ('B', 'Cold Coffee', 'Thick cold coffee', 60.0, 'Beverages', '/images/food_cold_coffee.jpg', 50, 0),
                    ('C', 'Samosa', 'Crispy potato samosa', 15.0, 'Snacks', '/images/food_samosa.jpg', 60, 0),
                    ('C', 'Tea', 'Masala chai', 10.0, 'Beverages', '/images/food_tea.jpg', 100, 0),
                    ('C', 'Special Brownie', 'Hot chocolate brownie', 90.0, 'Snacks', '/images/food_brownie.jpg', 25, 1)
                ]
                for item in menu:
                    await db.execute('''
                        INSERT INTO menu_items (canteen_id, name, description, price, category, image_url, inventory, is_special)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', item)

        # Force Update Canteen and Menu Item images for existing DB setups
        canteen_imgs = {
            'A': '/images/canteen_a.jpg',
            'B': '/images/canteen_b.jpg',
            'C': '/images/canteen_c.jpg'
        }
        for cid, img in canteen_imgs.items():
            await db.execute("UPDATE canteens SET image_url = ? WHERE id = ?", (img, cid))

        menu_item_imgs = {
            'Dosa': '/images/food_dosa.jpg',
            'Special Paneer Dosa': '/images/food_paneer_dosa.jpg',
            'Idli': '/images/food_idli.jpg',
            'Fried Rice': '/images/food_fried_rice.jpg',
            'Burger': '/images/food_burger.jpg',
            'Special Pizza': '/images/food_pizza.jpg',
            'Cold Coffee': '/images/food_cold_coffee.jpg',
            'Samosa': '/images/food_samosa.jpg',
            'Tea': '/images/food_tea.jpg',
            'Special Brownie': '/images/food_brownie.jpg'
        }
        for name, img in menu_item_imgs.items():
            await db.execute("UPDATE menu_items SET image_url = ? WHERE name = ?", (img, name))

        await db.commit()
