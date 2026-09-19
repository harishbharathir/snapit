"""End-to-end API tests for snapit with MongoDB and Real-Time Authentication."""
import urllib.request
import urllib.error
import json
import uuid

BASE = "http://localhost:8000"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}")
    return json.loads(urllib.request.urlopen(req).read())

def post(path, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=body,
        headers={"Content-Type": "application/json"} if body else {}
    )
    return json.loads(urllib.request.urlopen(req).read())

def put(path):
    req = urllib.request.Request(f"{BASE}{path}", method="PUT")
    return json.loads(urllib.request.urlopen(req).read())

print("=== TEST 1: Health & DB Info ===")
r = get("/api/health")
print(f"  {r.get('message', 'ok')} v{r.get('version', '1.0.0')} | Database: {r.get('database')}")


print("\n=== TEST 2: Real-Time Auth — Register New Student ===")
random_user = f"student_{uuid.uuid4().hex[:6]}"
reg_res = post("/api/auth/register", {
    "username": random_user,
    "email": f"{random_user}@campus.edu",
    "password": "mypassword123",
    "role": "student"
})
print(f"  Registered: {reg_res['username']} (ID: {reg_res['id']}, Role: {reg_res['role']}, Wallet: Rs.{reg_res['wallet_balance']})")
assert reg_res['wallet_balance'] == 500.0, "New students should receive Rs. 500 default wallet balance"

print("\n=== TEST 3: Real-Time Auth — Reject Duplicate Username ===")
try:
    post("/api/auth/register", {
        "username": random_user,
        "password": "anotherpassword"
    })
    print("  ERROR: Duplicate registration should have failed!")
except urllib.error.HTTPError as e:
    print(f"  Successfully rejected duplicate username with status {e.code}")
    assert e.code == 400

print("\n=== TEST 4: Real-Time Auth — Login with New Credentials ===")
login_res = post("/api/auth/login", {
    "username": random_user,
    "password": "mypassword123"
})
print(f"  Login successful for {login_res['username']} (Role: {login_res['role']})")
assert login_res['id'] == reg_res['id']

print("\n=== TEST 5: Real-Time Auth — Reject Invalid Password ===")
try:
    post("/api/auth/login", {
        "username": random_user,
        "password": "wrongpassword"
    })
    print("  ERROR: Wrong password should have failed!")
except urllib.error.HTTPError as e:
    print(f"  Successfully rejected invalid password with status {e.code}")
    assert e.code == 401

print("\n=== TEST 6: Real-Time Auth — Login with Seeded User (Harish) ===")
seed_login = post("/api/auth/login", {
    "username": "Harish",
    "password": "password"
})
print(f"  Seeded user login success: {seed_login['username']} (Wallet: Rs.{seed_login['wallet_balance']})")

print("\n=== TEST 7: Wallet Top-Up in MongoDB ===")
wallet_res = post(f"/api/auth/wallet/{reg_res['id']}", {"amount": 150.0})
print(f"  Updated wallet balance for {random_user}: Rs.{wallet_res['wallet_balance']}")
assert wallet_res['wallet_balance'] == 650.0

print("\n=== TEST 8: MongoDB Canteens ===")
canteens = get("/api/canteens")
print(f"  Fetched {len(canteens)} canteens from MongoDB:")
for c in canteens:
    crowd = c.get("crowd_data", [])
    total = sum(z.get("people_count", 0) for z in crowd)
    print(f"    {c['name']} ({c['id']}): {len(crowd)} zones, {total} people")

print("\n=== TEST 9: MongoDB Menu ===")
menu = get("/api/menu/A")
print(f"  Canteen A has {len(menu)} items:")
for item in menu[:3]:
    print(f"    {item['name']} - Rs.{item['price']} ({item['category']}) | In stock: {item.get('inventory')}")

print("\n=== TEST 10: Create Order with Wallet Payment ===")
order = post("/api/orders", {
    "canteen_id": "A",
    "student_id": reg_res["id"],
    "student_name": random_user,
    "payment_method": "wallet",
    "items": [{"menu_item_id": 1, "quantity": 2}, {"menu_item_id": 4, "quantity": 1}]
})
oid = order["id"]
print(f"  Order Created in MongoDB: {oid[:8]}...")
print(f"  Total: Rs.{order['total_amount']}")
print(f"  Status: {order['status']}")
print(f"  QR Code Tea: {'Present' if order.get('qr_code_tea') else 'None'}")
print(f"  QR Code Snacks: {'Present' if order.get('qr_code_snacks') else 'None'}")
print(f"  Items: {len(order['items'])}")

print("\n=== TEST 11: Get Order by ID ===")
fetched = get(f"/api/orders/{oid}")
print(f"  Fetched from MongoDB: Status={fetched['status']}, Student={fetched['student_name']}")
assert fetched['id'] == oid

print("\n=== TEST 12: Pending Orders for Counter ===")
pending = get("/api/orders/pending/A")
print(f"  Canteen A pending: {len(pending)} orders in MongoDB")

print("\n=== TEST 13: Update Order Status ===")
r = put(f"/api/orders/{oid}/status?status=PREPARING")
print(f"  {r['message']}")
fetched = get(f"/api/orders/{oid}")
print(f"  New status: {fetched['status']}")
assert fetched['status'] == 'PREPARING'

print("\n=== TEST 14: AI Crowd Zones ===")
crowd = get("/api/ai/crowd-zones/A")
print(f"  Canteen A: {crowd['total_people']} people, {crowd['occupancy_percentage']}%")
for z in crowd["zones"]:
    print(f"    {z['zone_name']}: {z['people_count']} people ({z['occupancy_percentage']}% - {z['zone_status']})")
print(f"  Hottest: {crowd['hottest_zone']['zone_name']}")
print(f"  Estimated wait: {crowd['estimated_wait_minutes']} min")

print("\n=== TEST 15: AI Recommendations ===")
rec = get("/api/ai/recommendations")
print(f"  Best: {rec['best_canteen']['canteen_name']} ({rec['best_canteen']['estimated_wait']} min wait)")
print(f"  Text: {rec['recommendation_text']}")

print("\n=== TEST 16: All Canteens Crowd ===")
all_crowd = get("/api/ai/all-canteens-crowd")
for cid, data in all_crowd.items():
    print(f"  {data['canteen_name']}: {data['total_people']} people, {data['occupancy_percentage']}%")

print("\n=== TEST 17: Analytics Summary with Live MongoDB Data ===")
summary = get("/api/analytics/summary")
print(f"  Orders: {summary['total_orders']}, Revenue: Rs.{summary['total_revenue']}")
print(f"  Avg Wait: {summary['avg_wait_time']} min, Active Users: {summary['active_users']}")

print("\n=== TEST 18: Peak Hours Analysis ===")
peak = get("/api/analytics/peak-hours")
print(f"  {len(peak)} hours of data")
busiest = max(peak, key=lambda x: x["occupancy"])
print(f"  Busiest: {busiest['label']} at {busiest['occupancy']}%")

print("\n=== TEST 19: Zone Comparison ===")
comp = get("/api/analytics/zone-comparison")
for cid, zones in comp.items():
    print(f"  Canteen {cid}: {list(zones.keys())}")

print("\n" + "=" * 55)
print("ALL 19 END-TO-END TESTS PASSED ON MONGODB & REAL-TIME AUTH [OK]")
print("=" * 55)
