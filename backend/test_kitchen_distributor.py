import asyncio
import os
import sys

# Ensure backend path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_database
from models import KitchenRestockRequestCreate, KitchenRestockRequestStatusUpdate
from routes.kitchen_distributor import (
    create_restock_request,
    get_kitchen_requests,
    get_batch_summary,
    update_request_status,
    restock_canteen_inventory,
    get_canteen_notifications
)
from routes.orders import create_order
from models import OrderCreate, OrderItemCreate

async def run_tests():
    print("=== STARTING KITCHEN FACTORY DISTRIBUTOR TESTS ===")
    await init_db()
    db = get_database()

    # 1. Ensure item 8 (Samosa) exists in Canteen C with known inventory
    item = await db.menu_items.find_one({"id": 8, "canteen_id": "C"})
    if not item:
        # Create item if not present
        await db.menu_items.insert_one({
            "id": 8,
            "canteen_id": "C",
            "name": "Samosa",
            "category": "Snacks",
            "price": 15.0,
            "available": True,
            "inventory": 12,
            "low_stock_threshold": 10
        })
    else:
        await db.menu_items.update_one({"id": 8, "canteen_id": "C"}, {"$set": {"inventory": 12, "low_stock_threshold": 10}})

    print("[PASS] Initialized menu item Samosa with inventory: 12 (threshold: 10)")

    # 2. Test Manual Restock Request from Canteen Counter
    create_payload = KitchenRestockRequestCreate(
        canteen_id="C",
        menu_item_id=8,
        quantity=50,
        notes="Staff counter manual request"
    )
    req_res = await create_restock_request(create_payload)
    req_id = req_res["id"]
    print(f"[PASS] Created Restock Request: {req_id} for {req_res['item_name']} (Qty: {req_res['requested_quantity']}, Status: {req_res['status']})")
    assert req_res["status"] == "REQUESTED"
    assert req_res["requested_quantity"] == 50

    # 3. Test Batch Summary for Factory Kitchen Chef
    batch_summary = await get_batch_summary()
    print(f"[PASS] Batch Summary items: {len(batch_summary)}")
    samosa_batch = next((b for b in batch_summary if b["item_name"] == "Samosa"), None)
    assert samosa_batch is not None, "Samosa should appear in batch summary"
    print(f"       Samosa Total Needed Campus-Wide: {samosa_batch['total_requested']} across {len(samosa_batch['canteens'])} canteen(s)")

    # 4. Central Kitchen Chef starts cooking: status -> COOKING
    cook_res = await update_request_status(req_id, KitchenRestockRequestStatusUpdate(status="COOKING"))
    print(f"[PASS] Kitchen Chef started cooking: {cook_res['message']}")
    assert cook_res["request"]["status"] == "COOKING"

    # 5. Central Kitchen Chef completes cooking: status -> COOKED
    cooked_res = await update_request_status(req_id, KitchenRestockRequestStatusUpdate(status="COOKED"))
    print(f"[PASS] Kitchen Chef finished cooking: {cooked_res['message']}")
    assert cooked_res["request"]["status"] == "COOKED"
    assert cooked_res["request"]["cooked_at"] is not None

    # 6. Verify Staff Counter receives notification for Canteen C
    notifications = await get_canteen_notifications("C")
    print(f"[PASS] Canteen C received {len(notifications)} active cooked delivery alerts")
    notif_match = next((n for n in notifications if n["id"] == req_id), None)
    assert notif_match is not None, "Canteen C must have active notification for this cooked item"
    print(f"       Notification: {notif_match['item_name']} - {notif_match['requested_quantity']} units cooked!")

    # 7. Staff Counter receives delivery and clicks "Restock (+50)"
    prev_item = await db.menu_items.find_one({"id": 8, "canteen_id": "C"})
    prev_inv = prev_item["inventory"]
    restock_res = await restock_canteen_inventory(req_id)
    print(f"[PASS] Staff Counter Restocked: {restock_res['message']}")
    assert restock_res["new_inventory"] == prev_inv + 50, f"Expected {prev_inv + 50}, got {restock_res['new_inventory']}"

    # Verify request status in DB is RESTOCKED
    db_req = await db.kitchen_requests.find_one({"id": req_id})
    assert db_req["status"] == "RESTOCKED"
    print(f"[PASS] DB request marked RESTOCKED with timestamp: {db_req.get('restocked_at')}")

    # 8. Test Automatic Depletion Trigger via Student Order
    # Reset item inventory to 11
    await db.menu_items.update_one({"id": 8, "canteen_id": "C"}, {"$set": {"inventory": 11}})
    # Ordering 3 samosas will drop inventory from 11 to 8 (which is <= threshold of 10)
    order_payload = OrderCreate(
        canteen_id="C",
        student_id="student1",
        student_name="Test Student",
        payment_method="cash",
        items=[OrderItemCreate(menu_item_id=8, quantity=3)]
    )
    placed_order = await create_order(order_payload)
    print(f"[PASS] Student placed order: {placed_order.id[:8]}... Total: Rs.{placed_order.total_amount}")

    # Check that auto-request was generated in kitchen_requests!
    auto_req = await db.kitchen_requests.find_one({
        "canteen_id": "C",
        "menu_item_id": 8,
        "is_auto_triggered": True,
        "status": "REQUESTED"
    })
    assert auto_req is not None, "Auto-depletion should have created a kitchen restock request!"
    print(f"[PASS] Auto-depletion triggered: Request {auto_req['id']} created for {auto_req['item_name']} (Remaining Stock: {auto_req['current_inventory']})")

    print("\n" + "=" * 50)
    print("ALL KITCHEN DISTRIBUTOR & NOTIFICATION TESTS PASSED!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(run_tests())
