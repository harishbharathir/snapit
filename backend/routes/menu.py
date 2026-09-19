from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from database import get_db
from models import CanteenResponse, MenuItem
from services.crowd_service import crowd_service

router = APIRouter(prefix='/api', tags=['menu'])

@router.get('/canteens', response_model=List[CanteenResponse])
async def get_canteens():
    async with get_db() as db:
        canteens = await db.canteens.find({}, {"_id": 0}).to_list(100)
        
        # Attach crowd data
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
