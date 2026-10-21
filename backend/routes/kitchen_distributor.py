from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict
from datetime import datetime
import uuid

from database import get_db
from models import (
    KitchenRestockRequestCreate,
    KitchenRestockRequestStatusUpdate,
    KitchenRestockResponse
)
from routes.orders import notification_manager

router = APIRouter(prefix='/api/kitchen', tags=['kitchen-distributor'])


@router.get('/requests', response_model=List[KitchenRestockResponse])
async def get_kitchen_requests(
    canteen_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """
    Get factory distributor restock requests.
    Supports filtering by canteen and status.
    """
    async with get_db() as db:
        query: Dict = {}
        if canteen_id and canteen_id != 'ALL':
            query["canteen_id"] = canteen_id
        if status:
            if status == 'ACTIVE':
                query["status"] = {"$in": ["REQUESTED", "COOKING", "COOKED"]}
            else:
                query["status"] = status

        cursor = db.kitchen_requests.find(query, {"_id": 0}).sort("created_at", -1)
        requests = await cursor.to_list(200)
        return requests


@router.get('/batch-summary')
async def get_batch_summary():
    """
    Aggregate demand campus-wide by food item across all canteens.
    This enables the central factory kitchen to cook in bulk efficiently.
    """
    async with get_db() as db:
        active_requests = await db.kitchen_requests.find(
            {"status": {"$in": ["REQUESTED", "COOKING"]}},
            {"_id": 0}
        ).to_list(500)

        summary_map: Dict[str, dict] = {}

        for req in active_requests:
            item_name = req.get("item_name", "Unknown")
            cat = req.get("category", "General")
            qty = req.get("requested_quantity", 0)
            cid = req.get("canteen_id", "")
            cname = req.get("canteen_name", f"Canteen {cid}")
            req_status = req.get("status", "REQUESTED")

            if item_name not in summary_map:
                summary_map[item_name] = {
                    "item_name": item_name,
                    "category": cat,
                    "total_requested": 0,
                    "canteens": [],
                    "request_ids": [],
                    "has_cooking": False,
                    "all_requested": True
                }

            summary_map[item_name]["total_requested"] += qty
            summary_map[item_name]["request_ids"].append(req.get("id"))
            summary_map[item_name]["canteens"].append({
                "request_id": req.get("id"),
                "canteen_id": cid,
                "canteen_name": cname,
                "quantity": qty,
                "current_inventory": req.get("current_inventory", 0),
                "status": req_status
            })
            if req_status == "COOKING":
                summary_map[item_name]["has_cooking"] = True
                summary_map[item_name]["all_requested"] = False

        return list(summary_map.values())


@router.post('/requests', response_model=KitchenRestockResponse)
async def create_restock_request(payload: KitchenRestockRequestCreate):
    """
    Create a new manual or auto-initiated restock request to Central Kitchen.
    """
    async with get_db() as db:
        # Find menu item
        menu_item = await db.menu_items.find_one({
            "id": payload.menu_item_id,
            "canteen_id": payload.canteen_id
        })
        if not menu_item:
            # Try finding item by id alone
            menu_item = await db.menu_items.find_one({"id": payload.menu_item_id})
        
        if not menu_item:
            raise HTTPException(status_code=404, detail="Menu item not found")

        # Find canteen name
        canteen = await db.canteens.find_one({"id": payload.canteen_id})
        canteen_name = canteen.get("name", f"Canteen {payload.canteen_id}") if canteen else f"Canteen {payload.canteen_id}"

        # Prevent duplicate open requests
        existing = await db.kitchen_requests.find_one({
            "canteen_id": payload.canteen_id,
            "menu_item_id": payload.menu_item_id,
            "status": {"$in": ["REQUESTED", "COOKING", "COOKED"]}
        })
        if existing:
            existing.pop("_id", None)
            return existing

        req_id = f"KREQ-{uuid.uuid4().hex[:8].upper()}"
        doc = {
            "id": req_id,
            "canteen_id": payload.canteen_id,
            "canteen_name": canteen_name,
            "menu_item_id": payload.menu_item_id,
            "item_name": menu_item.get("name", "Item"),
            "category": menu_item.get("category", "General"),
            "requested_quantity": payload.quantity or 50,
            "current_inventory": menu_item.get("inventory", 0),
            "status": "REQUESTED",
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "cooked_at": None,
            "restocked_at": None,
            "is_auto_triggered": False,
            "notes": payload.notes or "Manual replenishment request from counter"
        }

        await db.kitchen_requests.insert_one(doc)
        doc.pop("_id", None)

        # Broadcast real-time notification to Kitchen Display
        await notification_manager.broadcast({
            "type": "NEW_KITCHEN_REQUEST",
            "request": doc
        })

        return doc


@router.put('/requests/{request_id}/status')
async def update_request_status(request_id: str, payload: KitchenRestockRequestStatusUpdate):
    """
    Central Kitchen updates request status (e.g. COOKING -> COOKED / DISPATCHED).
    When marked as COOKED, immediately notifies that specific Canteen's Staff Counter!
    """
    async with get_db() as db:
        req = await db.kitchen_requests.find_one({"id": request_id})
        if not req:
            raise HTTPException(status_code=404, detail="Restock request not found")

        update_fields: Dict = {
            "status": payload.status,
            "updated_at": datetime.now()
        }
        if payload.notes:
            update_fields["notes"] = payload.notes

        if payload.status == "COOKED":
            update_fields["cooked_at"] = datetime.now()

        await db.kitchen_requests.update_one(
            {"id": request_id},
            {"$set": update_fields}
        )

        updated_req = await db.kitchen_requests.find_one({"id": request_id}, {"_id": 0})

        # When food is cooked, trigger real-time notification to the canteen counter!
        if payload.status == "COOKED":
            notification_data = {
                "type": "KITCHEN_FOOD_COOKED",
                "request_id": request_id,
                "canteen_id": req.get("canteen_id"),
                "canteen_name": req.get("canteen_name"),
                "menu_item_id": req.get("menu_item_id"),
                "item_name": req.get("item_name"),
                "quantity": req.get("requested_quantity"),
                "message": f"Central Kitchen has finished cooking {req.get('requested_quantity')}x {req.get('item_name')}! Food is dispatched to your counter.",
                "timestamp": datetime.now().isoformat()
            }
            # Send targeted notification to that specific canteen counter and broadcast
            await notification_manager.send_to_canteen(notification_data, req.get("canteen_id", ""))

        return {
            "message": f"Status updated to {payload.status}",
            "request": updated_req
        }


@router.post('/requests/batch-cook')
async def batch_cook(payload: Dict):
    """
    Bulk update all requests for a specific item to COOKING or COOKED.
    payload: {"request_ids": ["KREQ-1", "KREQ-2"], "status": "COOKED"}
    """
    req_ids = payload.get("request_ids", [])
    new_status = payload.get("status", "COOKED")
    if not req_ids:
        raise HTTPException(status_code=400, detail="No request_ids provided")

    async with get_db() as db:
        for rid in req_ids:
            req = await db.kitchen_requests.find_one({"id": rid})
            if not req:
                continue

            update_data = {
                "status": new_status,
                "updated_at": datetime.now()
            }
            if new_status == "COOKED":
                update_data["cooked_at"] = datetime.now()

            await db.kitchen_requests.update_one({"id": rid}, {"$set": update_data})

            if new_status == "COOKED":
                await notification_manager.send_to_canteen({
                    "type": "KITCHEN_FOOD_COOKED",
                    "request_id": rid,
                    "canteen_id": req.get("canteen_id"),
                    "canteen_name": req.get("canteen_name"),
                    "menu_item_id": req.get("menu_item_id"),
                    "item_name": req.get("item_name"),
                    "quantity": req.get("requested_quantity"),
                    "message": f"Central Kitchen cooked {req.get('requested_quantity')}x {req.get('item_name')} for your counter!",
                    "timestamp": datetime.now().isoformat()
                }, req.get("canteen_id", ""))

        return {"message": f"Updated {len(req_ids)} requests to {new_status}"}


@router.post('/requests/{request_id}/restock')
async def restock_canteen_inventory(request_id: str):
    """
    Called by the Staff Counter when incoming cooked food arrives from the Central Kitchen.
    Atomically adds the batch quantity to the menu item's inventory and marks request RESTOCKED.
    """
    async with get_db() as db:
        req = await db.kitchen_requests.find_one({"id": request_id})
        if not req:
            raise HTTPException(status_code=404, detail="Restock request not found")

        qty = req.get("requested_quantity", 50)
        item_id = req.get("menu_item_id")
        canteen_id = req.get("canteen_id")

        # 1. Increment menu item inventory and ensure availability
        menu_update = await db.menu_items.find_one_and_update(
            {"id": item_id, "canteen_id": canteen_id},
            {"$inc": {"inventory": qty}, "$set": {"available": True}},
            return_document=True
        )

        # Fallback if canteen_id is not isolated per menu item row
        if not menu_update:
            menu_update = await db.menu_items.find_one_and_update(
                {"id": item_id},
                {"$inc": {"inventory": qty}, "$set": {"available": True}},
                return_document=True
            )

        new_inventory = menu_update.get("inventory", 0) if menu_update else qty

        # 2. Update request status to RESTOCKED
        now = datetime.now()
        await db.kitchen_requests.update_one(
            {"id": request_id},
            {
                "$set": {
                    "status": "RESTOCKED",
                    "restocked_at": now,
                    "updated_at": now,
                    "current_inventory": new_inventory
                }
            }
        )

        # 3. Broadcast notification
        await notification_manager.broadcast({
            "type": "RESTOCK_COMPLETED",
            "request_id": request_id,
            "canteen_id": canteen_id,
            "item_name": req.get("item_name"),
            "added_quantity": qty,
            "new_inventory": new_inventory,
            "message": f"Successfully restocked +{qty} units of {req.get('item_name')}."
        })

        return {
            "message": f"Restocked +{qty} into inventory",
            "new_inventory": new_inventory,
            "request_id": request_id
        }


@router.get('/notifications/{canteen_id}')
async def get_canteen_notifications(canteen_id: str):
    """
    Fetch active cooked dispatches waiting to be acknowledged / restocked by staff counter.
    """
    async with get_db() as db:
        query = {
            "canteen_id": canteen_id,
            "status": "COOKED"
        }
        cooked_requests = await db.kitchen_requests.find(query, {"_id": 0}).sort("cooked_at", -1).to_list(50)
        return cooked_requests
