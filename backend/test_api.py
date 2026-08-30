"""End-to-end API smoke tests for snapit."""
import urllib.request
import json

BASE = "http://localhost:8000"

def get(path):
    return json.loads(urllib.request.urlopen(f"{BASE}{path}").read())

def post(path, data=None):
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers={"Content-Type": "application/json"} if body else {})
    return json.loads(urllib.request.urlopen(req).read())

def put(path):
    req = urllib.request.Request(f"{BASE}{path}", method="PUT")
    return json.loads(urllib.request.urlopen(req).read())

print("=== TEST 1: Root ===")
r = get("/")
print(f"  {r['message']} v{r['version']}")

print("\n=== TEST 2: Canteens ===")
canteens = get("/api/canteens")
for c in canteens:
    crowd = c.get("crowd_data", [])
    total = sum(z.get("people_count", 0) for z in crowd)
    print(f"  {c['name']} ({c['id']}): {len(crowd)} zones, {total} people")

print("\n=== TEST 3: Menu ===")
menu = get("/api/menu/A")
print(f"  Canteen A has {len(menu)} items")
for item in menu[:3]:
    print(f"    {item['name']} - Rs.{item['price']} ({item['category']})")

print("\n=== TEST 4: Create Order ===")
order = post("/api/orders", {
    "canteen_id": "A",
    "student_name": "Harish",
    "items": [{"menu_item_id": 1, "quantity": 2}, {"menu_item_id": 4, "quantity": 1}]
})
oid = order["id"]
print(f"  Order: {oid[:8]}...")
print(f"  Total: Rs.{order['total_amount']}")
print(f"  Status: {order['status']}")
print(f"  QR Code: {len(order['qr_code'])} chars")
print(f"  Items: {len(order['items'])}")

print("\n=== TEST 5: Get Order ===")
fetched = get(f"/api/orders/{oid}")
print(f"  Status: {fetched['status']}, Student: {fetched['student_name']}")

print("\n=== TEST 6: Pending Orders ===")
pending = get("/api/orders/pending/A")
print(f"  Canteen A pending: {len(pending)} orders")

print("\n=== TEST 7: Update Order Status ===")
r = put(f"/api/orders/{oid}/status?status=PREPARING")
print(f"  {r['message']}")
fetched = get(f"/api/orders/{oid}")
print(f"  New status: {fetched['status']}")

print("\n=== TEST 8: Crowd Zones ===")
crowd = get("/api/ai/crowd-zones/A")
print(f"  Canteen A: {crowd['total_people']} people, {crowd['occupancy_percentage']}%")
for z in crowd["zones"]:
    print(f"    {z['zone_name']}: {z['people_count']} people ({z['occupancy_percentage']}% - {z['zone_status']})")
print(f"  Hottest: {crowd['hottest_zone']['zone_name']}")
print(f"  Wait: {crowd['estimated_wait_minutes']} min")

print("\n=== TEST 9: Recommendations ===")
rec = get("/api/ai/recommendations")
print(f"  Best: {rec['best_canteen']['canteen_name']} ({rec['best_canteen']['estimated_wait']} min)")
print(f"  Text: {rec['recommendation_text']}")

print("\n=== TEST 10: All Canteens Crowd ===")
all_crowd = get("/api/ai/all-canteens-crowd")
for cid, data in all_crowd.items():
    print(f"  {data['canteen_name']}: {data['total_people']} people, {data['occupancy_percentage']}%")

print("\n=== TEST 11: Analytics Summary ===")
summary = get("/api/analytics/summary")
print(f"  Orders: {summary['total_orders']}, Revenue: Rs.{summary['total_revenue']}")
print(f"  Avg Wait: {summary['avg_wait_time']}min, Active Users: {summary['active_users']}")

print("\n=== TEST 12: Peak Hours ===")
peak = get("/api/analytics/peak-hours")
print(f"  {len(peak)} hours of data")
busiest = max(peak, key=lambda x: x["occupancy"])
print(f"  Busiest: {busiest['label']} at {busiest['occupancy']}%")

print("\n=== TEST 13: Zone Comparison ===")
comp = get("/api/analytics/zone-comparison")
for cid, zones in comp.items():
    print(f"  Canteen {cid}: {zones}")

print("\n" + "=" * 50)
print("ALL 13 TESTS PASSED ✓")
print("=" * 50)
