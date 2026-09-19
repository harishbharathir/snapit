import sys
import os
import random
from datetime import datetime
from typing import Dict, Any


# Attempt to import CrowdAnalyzer
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
try:
    from crowd_analyzer import CrowdAnalyzer, analyze_canteen, YOLO_AVAILABLE
    HAS_ANALYZER = True
except ImportError:
    HAS_ANALYZER = False
    YOLO_AVAILABLE = False

class CrowdService:
    def __init__(self):
        self.latest_data = {}
        self.crowd_history = []
        # Video settings for live feeds
        self.video_offsets = {'A': 0, 'B': 100, 'C': 200}
        self.video_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dataset_video.mp4'))
        self.analyzers = {
            'A': CrowdAnalyzer('A'),
            'B': CrowdAnalyzer('B'),
            'C': CrowdAnalyzer('C')
        }
        # Base stats for canteens
        self.canteen_bases = {
            'A': {'Counter': (5, 15), 'Seating': (10, 30), 'Entry': (2, 10)},
            'B': {'Counter': (2, 8), 'Seating': (5, 15), 'Entry': (0, 5)},
            'C': {'Counter': (3, 10), 'Seating': (8, 20), 'Entry': (1, 8)}
        }
        self.capacities = {
            'A': {'Counter': 20, 'Seating': 50, 'Entry': 15},
            'B': {'Counter': 15, 'Seating': 40, 'Entry': 10},
            'C': {'Counter': 10, 'Seating': 30, 'Entry': 10}
        }
        self.zone_ids = {
            'Counter': 'z1',
            'Seating': 'z2',
            'Entry': 'z3'
        }
        self.zone_coords = {
            'Counter': (0, 0, 100, 100),
            'Seating': (100, 100, 200, 200),
            'Entry': (300, 300, 50, 50)
        }

    def simulate_crowd_data(self, canteen_id: str) -> list:
        bases = self.canteen_bases.get(canteen_id, self.canteen_bases['A'])
        caps = self.capacities.get(canteen_id, self.capacities['A'])
        
        zones = []
        for zname, (min_p, max_p) in bases.items():
            # Random walk
            if canteen_id in self.latest_data:
                prev_zone = next((z for z in self.latest_data[canteen_id] if z['zone_name'] == zname), None)
                if prev_zone:
                    change = random.randint(-2, 2)
                    people = max(min_p, min(max_p, prev_zone['people_count'] + change))
                else:
                    people = random.randint(min_p, max_p)
            else:
                people = random.randint(min_p, max_p)
                
            capacity = caps[zname]
            occ = round((people / capacity) * 100, 2) if capacity > 0 else 0
            
            coords = self.zone_coords[zname]
            
            zone_data = {
                'canteen_id': canteen_id,
                'zone_id': self.zone_ids[zname],
                'zone_name': zname,
                'people_count': people,
                'occupancy_percentage': occ,
                'zone_status': self.get_status(occ),
                'x': coords[0],
                'y': coords[1],
                'width': coords[2],
                'height': coords[3]
            }
            zones.append(zone_data)
            
        self.latest_data[canteen_id] = zones
        return zones

    def get_status(self, occupancy: float) -> str:
        if occupancy < 40:
            return 'LOW'
        elif occupancy < 70:
            return 'MEDIUM'
        return 'HIGH'
        
    def calculate_wait_time(self, counter_people: int) -> float:
        return (counter_people * 0.8) + 2
        
    def get_recommendations(self, canteen_id: str) -> dict:
        zones = self.latest_data.get(canteen_id, [])
        if not zones:
            return {}
            
        counter_zone = next((z for z in zones if z['zone_name'] in ('Counter', 'Counter Area')), None)
        seating_zone = next((z for z in zones if z['zone_name'] in ('Seating', 'Seating Area')), None)
        
        wait = self.calculate_wait_time(counter_zone['people_count']) if counter_zone else 5.0
        
        recs = {
            'for_students': f'Estimated wait time is {wait:.1f} mins.',
            'for_staff': 'Normal operations.',
            'for_admin': 'Monitor peak hours.'
        }
        
        if counter_zone and counter_zone['occupancy_percentage'] > 70:
            recs['for_students'] = f'High wait time ({wait:.1f} mins). Consider ordering later or from another canteen.'
            recs['for_staff'] = 'Counter is busy. Open another lane if possible.'
            
        if seating_zone and seating_zone['occupancy_percentage'] > 80:
            recs['for_admin'] = 'Seating capacity reached. Consider adding more tables.'
            
        return recs

    async def save_crowd_data(self, db, data: list):
        if not data:
            return
        records = []
        for z in data:
            rec = dict(z)
            rec['timestamp'] = datetime.now()
            records.append(rec)
        try:
            await db.crowd_zone_data.insert_many(records)
        except Exception as e:
            print(f"Error saving crowd data: {e}")
            
    async def get_latest_crowd_data(self, db, canteen_id: str) -> list:
        try:
            rows = await db.crowd_zone_data.find(
                {"canteen_id": canteen_id},
                {"_id": 0}
            ).sort("timestamp", -1).limit(3).to_list(3)
            if rows:
                return rows
        except Exception as e:
            print(f"Error reading crowd data: {e}")
        # fallback to memory
        return self.latest_data.get(canteen_id, [])
        
    async def get_all_canteen_crowd_data(self, db) -> dict:
        return self.latest_data


    async def update_all_canteens(self, db=None):
        import asyncio
        for c in ['A', 'B', 'C']:
            data = None
            if HAS_ANALYZER and YOLO_AVAILABLE:
                try:
                    start_frame = self.video_offsets.get(c, 0)
                    loop = asyncio.get_running_loop()
                    result = await loop.run_in_executor(
                        None, 
                        analyze_canteen, 
                        c, 
                        self.video_path, 
                        2,       # max_frames to analyze (keeps it fast)
                        False,   # use_simulation
                        start_frame
                    )
                    data = result.get('zones')
                    for z in data:
                        z['canteen_id'] = c
                        z['zone_status'] = z.get('status', 'LOW')
                    
                    # Advance rolling offset (wrap around video length of 341)
                    self.video_offsets[c] = (start_frame + 25) % 330
                except Exception as e:
                    print(f"YOLO analysis failed for canteen {c}: {e}")
            
            if not data:
                data = self.simulate_crowd_data(c)
                
            self.latest_data[c] = data
            if db:
                await self.save_crowd_data(db, data)

        # Record total active users count history (keep last 10 readings)
        total_active = 0
        for c in ['A', 'B', 'C']:
            zones = self.latest_data.get(c, [])
            total_active += sum(z.get('people_count', 0) for z in zones)
        self.crowd_history.append(total_active)
        if len(self.crowd_history) > 10:
            self.crowd_history.pop(0)

crowd_service = CrowdService()
