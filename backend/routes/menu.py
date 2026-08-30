from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from database import get_db
from models import CanteenResponse, MenuItem
from services.crowd_service import crowd_service

router = APIRouter(prefix='/api', tags=['menu'])

@router.get('/canteens', response_model=List[CanteenResponse])
async def get_canteens():
    async with get_db() as db:
        async with db.execute("SELECT * FROM canteens") as cursor:
            rows = await cursor.fetchall()
            canteens = [dict(r) for r in rows]
            
            # Attach crowd data
            for c in canteens:
                c['crowd_data'] = crowd_service.latest_data.get(c['id'], [])
            return canteens

@router.get('/menu/{canteen_id}', response_model=List[MenuItem])
async def get_menu(canteen_id: str, category: Optional[str] = None):
    async with get_db() as db:
        if category:
            async with db.execute("SELECT * FROM menu_items WHERE canteen_id = ? AND category = ?", (canteen_id, category)) as cursor:
                return [dict(r) for r in await cursor.fetchall()]
        else:
            async with db.execute("SELECT * FROM menu_items WHERE canteen_id = ?", (canteen_id,)) as cursor:
                return [dict(r) for r in await cursor.fetchall()]
