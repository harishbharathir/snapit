from fastapi import APIRouter, HTTPException
from database import get_db
from services.crowd_service import crowd_service
from datetime import datetime

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    from crowd_analyzer import CrowdAnalyzer, analyze_canteen, YOLO_AVAILABLE
    HAS_ANALYZER = True
except ImportError:
    HAS_ANALYZER = False
    YOLO_AVAILABLE = False

router = APIRouter(prefix='/api/ai', tags=['ai'])

CANTEEN_NAMES = {"A": "Main Canteen", "B": "Food Court", "C": "Snack Corner"}


@router.get('/crowd-zones/{canteen_id}')
async def get_crowd_zones(canteen_id: str):
    """Get latest zone-level crowd data for a canteen."""
    if canteen_id not in CANTEEN_NAMES:
        raise HTTPException(status_code=404, detail=f"Canteen {canteen_id} not found")

    data = crowd_service.latest_data.get(canteen_id)
    if not data:
        data = crowd_service.simulate_crowd_data(canteen_id)

    zones = data if isinstance(data, list) else data.get('zones', data)

    # Build full response
    total_people = sum(z.get('people_count', 0) for z in zones)
    avg_occ = sum(z.get('occupancy_percentage', 0) for z in zones) / max(len(zones), 1)
    hottest = max(zones, key=lambda z: z.get('occupancy_percentage', 0)) if zones else None
    recs = crowd_service.get_recommendations(canteen_id)
    counter = next((z for z in zones if z.get('zone_id') in ('counter', 'z1') or z.get('zone_name') == 'Counter'), None)
    wait = crowd_service.calculate_wait_time(counter['people_count']) if counter else 5.0

    return {
        "canteen_id": canteen_id,
        "canteen_name": CANTEEN_NAMES.get(canteen_id, f"Canteen {canteen_id}"),
        "timestamp": datetime.now().isoformat(),
        "total_people": total_people,
        "occupancy_percentage": round(avg_occ, 1),
        "status": crowd_service.get_status(avg_occ),
        "zones": zones,
        "hottest_zone": {
            "zone_id": hottest.get('zone_id', '') if hottest else None,
            "zone_name": hottest.get('zone_name', '') if hottest else None,
            "occupancy_percentage": hottest.get('occupancy_percentage', 0) if hottest else 0,
        },
        "bottleneck_alert": (
            f"{hottest['zone_name']} is {hottest['occupancy_percentage']}% full"
            if hottest and hottest.get('occupancy_percentage', 0) > 60
            else None
        ),
        "recommendations": recs,
        "estimated_wait_minutes": round(wait, 1),
    }


@router.get('/recommendations')
async def get_recommendations():
    """Get cross-canteen recommendations — returns the best canteen to go to."""
    recs = []
    for cid in ['A', 'B', 'C']:
        data = crowd_service.latest_data.get(cid)
        if not data:
            data = crowd_service.simulate_crowd_data(cid)

        zones = data if isinstance(data, list) else data.get('zones', data)
        counter = next((z for z in zones if z.get('zone_id') in ('counter', 'z1') or z.get('zone_name') == 'Counter'), None)
        avg_occ = sum(z.get('occupancy_percentage', 0) for z in zones) / max(len(zones), 1)
        wait = crowd_service.calculate_wait_time(counter['people_count']) if counter else 5.0

        is_bottleneck = counter and counter.get('occupancy_percentage', 0) > 70
        recs.append({
            "canteen_id": cid,
            "canteen_name": CANTEEN_NAMES.get(cid, f"Canteen {cid}"),
            "occupancy": round(avg_occ, 1),
            "status": crowd_service.get_status(avg_occ),
            "bottleneck_zone": counter.get('zone_name') if is_bottleneck else None,
            "counter_people": counter['people_count'] if counter else 0,
            "reason": (
                f"Counter has {counter['people_count']} people waiting"
                if is_bottleneck else "Normal operations"
            ),
            "estimated_wait": round(wait, 1),
        })

    recs.sort(key=lambda x: x['estimated_wait'])
    best = recs[0] if recs else None

    return {
        "best_canteen": best,
        "recommendation_text": (
            f"Go to {best['canteen_name']} — shortest counter queue ({best['estimated_wait']} min wait)"
            if best else "No data available"
        ),
        "all_canteens": recs,
    }


@router.get('/all-canteens-crowd')
async def all_canteens_crowd():
    """Get crowd data for all canteens (for admin dashboard)."""
    result = {}
    for cid in ['A', 'B', 'C']:
        data = crowd_service.latest_data.get(cid)
        if not data:
            data = crowd_service.simulate_crowd_data(cid)

        zones = data if isinstance(data, list) else data.get('zones', data)
        total_people = sum(z.get('people_count', 0) for z in zones)
        avg_occ = sum(z.get('occupancy_percentage', 0) for z in zones) / max(len(zones), 1)
        hottest = max(zones, key=lambda z: z.get('occupancy_percentage', 0)) if zones else None

        result[cid] = {
            "canteen_id": cid,
            "canteen_name": CANTEEN_NAMES.get(cid, f"Canteen {cid}"),
            "total_people": total_people,
            "occupancy_percentage": round(avg_occ, 1),
            "status": crowd_service.get_status(avg_occ),
            "zones": zones,
            "hottest_zone": hottest.get('zone_name', '') if hottest else None,
        }
    return result


@router.post('/analyze-crowd')
async def analyze_crowd(canteen_id: str, video_path: str = None):
    """
    Trigger crowd analysis for a canteen.
    Uses real YOLO analysis if available and video_path provided,
    otherwise falls back to simulation.
    """
    if canteen_id not in CANTEEN_NAMES:
        raise HTTPException(status_code=404, detail=f"Canteen {canteen_id} not found")

    result = None

    # Try real analysis
    if HAS_ANALYZER and YOLO_AVAILABLE and video_path:
        try:
            result = analyze_canteen(canteen_id, video_source=video_path)
        except Exception as e:
            result = None  # Fall back to simulation

    # Simulation fallback
    if result is None:
        zones = crowd_service.simulate_crowd_data(canteen_id)
        total_people = sum(z['people_count'] for z in zones)
        avg_occ = sum(z['occupancy_percentage'] for z in zones) / max(len(zones), 1)
        hottest = max(zones, key=lambda z: z['occupancy_percentage']) if zones else None
        recs = crowd_service.get_recommendations(canteen_id)

        result = {
            "canteen_id": canteen_id,
            "canteen_name": CANTEEN_NAMES.get(canteen_id),
            "timestamp": datetime.now().isoformat(),
            "total_people": total_people,
            "occupancy_percentage": round(avg_occ, 1),
            "status": crowd_service.get_status(avg_occ),
            "zones": zones,
            "hottest_zone": hottest['zone_name'] if hottest else None,
            "bottleneck_alert": (
                f"Bottleneck at {hottest['zone_name']}"
                if hottest and hottest['occupancy_percentage'] > 70 else None
            ),
            "recommendations": recs,
        }

    # Save to DB
    async with get_db() as db:
        zones_to_save = result.get('zones', [])
        if isinstance(zones_to_save, list):
            await crowd_service.save_crowd_data(db, zones_to_save)

    return {"success": True, "data": result}


@router.post('/refresh')
async def refresh_simulated_data():
    """Force refresh simulated data for all canteens."""
    async with get_db() as db:
        await crowd_service.update_all_canteens(db)
    return {"message": "Data refreshed successfully", "timestamp": datetime.now().isoformat()}
