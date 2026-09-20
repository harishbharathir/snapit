from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from typing import List, Optional
import os, uuid, shutil
from database import get_db
from models import CanteenResponse, MenuItem

router = APIRouter(prefix='/api', tags=['menu'])

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)

CATEGORIES = ['South Indian', 'Chinese', 'Snacks', 'Beverages', 'North Indian', 'Fast Food', 'Desserts', 'Specials']

# ─────────────────────────────────────────
#  READ
# ─────────────────────────────────────────
@router.get('/canteens', response_model=List[CanteenResponse])
async def get_canteens():
    from services.crowd_service import crowd_service
    async with get_db() as db:
        canteens = await db.canteens.find({}, {"_id": 0}).to_list(100)
        for c in canteens:
            c['crowd_data'] = crowd_service.latest_data.get(c['id'], [])
        return canteens

@router.get('/menu/{canteen_id}', response_model=List[MenuItem])
async def get_menu(canteen_id: str, category: Optional[str] = None):
    async with get_db() as db:
        query = {"canteen_id": canteen_id}
        if category:
            query["category"] = category
        items = await db.menu_items.find(query, {"_id": 0}).sort("id", 1).to_list(200)
        return items

@router.get('/menu/{canteen_id}/categories')
async def get_categories(canteen_id: str):
    return {"categories": CATEGORIES}

# ─────────────────────────────────────────
#  CREATE  (multipart – supports image upload)
# ─────────────────────────────────────────
@router.post('/menu/{canteen_id}')
async def create_menu_item(
    canteen_id: str,
    name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    category: str = Form(...),
    inventory: int = Form(50),
    is_special: bool = Form(False),
    today_special: bool = Form(False),
    new_arrival: bool = Form(False),
    is_offer: bool = Form(False),
    offer_price: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    async with get_db() as db:
        # Get next id
        last = await db.menu_items.find_one({}, sort=[("id", -1)])
        next_id = (last['id'] if last else 0) + 1

        # Save image if provided
        image_url = f"/images/food_default.jpg"
        if image and image.filename:
            ext = os.path.splitext(image.filename)[-1].lower() or ".jpg"
            filename = f"item_{next_id}_{uuid.uuid4().hex[:8]}{ext}"
            save_path = os.path.join(UPLOADS_DIR, filename)
            with open(save_path, "wb") as f:
                shutil.copyfileobj(image.file, f)
            image_url = f"/uploads/{filename}"

        doc = {
            "id": next_id,
            "canteen_id": canteen_id,
            "name": name,
            "description": description,
            "price": price,
            "category": category,
            "image_url": image_url,
            "available": True,
            "inventory": inventory,
            "is_special": is_special,
            "today_special": today_special,
            "new_arrival": new_arrival,
            "is_offer": is_offer,
            "offer_price": offer_price,
        }
        await db.menu_items.insert_one(doc)
        doc.pop("_id", None)
        return doc

# ─────────────────────────────────────────
#  UPDATE  (JSON body for quick toggles/edits)
# ─────────────────────────────────────────
@router.put('/menu/{canteen_id}/{item_id}')
async def update_menu_item(canteen_id: str, item_id: int, body: dict):
    async with get_db() as db:
        result = await db.menu_items.find_one_and_update(
            {"canteen_id": canteen_id, "id": item_id},
            {"$set": body},
            return_document=True
        )
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
        result.pop("_id", None)
        return result

# ─────────────────────────────────────────
#  DELETE
# ─────────────────────────────────────────
@router.delete('/menu/{canteen_id}/{item_id}')
async def delete_menu_item(canteen_id: str, item_id: int):
    async with get_db() as db:
        item = await db.menu_items.find_one({"canteen_id": canteen_id, "id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        # Remove uploaded image if applicable
        if item.get("image_url", "").startswith("/uploads/"):
            fname = item["image_url"].replace("/uploads/", "")
            fpath = os.path.join(UPLOADS_DIR, fname)
            if os.path.exists(fpath):
                os.remove(fpath)
        await db.menu_items.delete_one({"canteen_id": canteen_id, "id": item_id})
        return {"success": True, "deleted_id": item_id}

# ─────────────────────────────────────────
#  UPDATE IMAGE ONLY  (separate endpoint)
# ─────────────────────────────────────────
@router.put('/menu/{canteen_id}/{item_id}/image')
async def update_menu_item_image(
    canteen_id: str,
    item_id: int,
    image: UploadFile = File(...),
):
    async with get_db() as db:
        item = await db.menu_items.find_one({"canteen_id": canteen_id, "id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        # Remove old uploaded image
        if item.get("image_url", "").startswith("/uploads/"):
            old_path = os.path.join(UPLOADS_DIR, item["image_url"].replace("/uploads/", ""))
            if os.path.exists(old_path):
                os.remove(old_path)

        ext = os.path.splitext(image.filename)[-1].lower() or ".jpg"
        filename = f"item_{item_id}_{uuid.uuid4().hex[:8]}{ext}"
        save_path = os.path.join(UPLOADS_DIR, filename)
        with open(save_path, "wb") as f:
            shutil.copyfileobj(image.file, f)
        new_url = f"/uploads/{filename}"

        await db.menu_items.update_one(
            {"canteen_id": canteen_id, "id": item_id},
            {"$set": {"image_url": new_url}}
        )
        return {"image_url": new_url}
