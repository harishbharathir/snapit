"""
Zone Mapping Configuration for Campus Canteens

Each canteen has 3 zones:
  - counter: The ordering/pickup counter area
  - seating: The dining/seating area
  - entry:   The entrance/queue area

Zone coordinates are in pixels relative to the camera frame.
Capacity is the comfortable max number of people for that zone.
"""

ZONE_CONFIG = {
    "A": {
        "name": "Main Canteen",
        "location": "Central Block, Ground Floor",
        "zones": [
            {
                "id": "counter",
                "name": "Counter Area",
                "x": 0,
                "y": 0,
                "width": 400,
                "height": 300,
                "capacity": 15,
            },
            {
                "id": "seating",
                "name": "Seating Area",
                "x": 400,
                "y": 0,
                "width": 880,
                "height": 720,
                "capacity": 40,
            },
            {
                "id": "entry",
                "name": "Entry Point",
                "x": 0,
                "y": 300,
                "width": 400,
                "height": 420,
                "capacity": 20,
            },
        ],
    },
    "B": {
        "name": "Food Court",
        "location": "Library Block, First Floor",
        "zones": [
            {
                "id": "counter",
                "name": "Counter Area",
                "x": 0,
                "y": 0,
                "width": 350,
                "height": 280,
                "capacity": 12,
            },
            {
                "id": "seating",
                "name": "Seating Area",
                "x": 350,
                "y": 0,
                "width": 930,
                "height": 720,
                "capacity": 35,
            },
            {
                "id": "entry",
                "name": "Entry Point",
                "x": 0,
                "y": 280,
                "width": 350,
                "height": 440,
                "capacity": 18,
            },
        ],
    },
    "C": {
        "name": "Snack Corner",
        "location": "Sports Complex, Ground Floor",
        "zones": [
            {
                "id": "counter",
                "name": "Counter Area",
                "x": 0,
                "y": 0,
                "width": 320,
                "height": 260,
                "capacity": 10,
            },
            {
                "id": "seating",
                "name": "Seating Area",
                "x": 320,
                "y": 0,
                "width": 960,
                "height": 720,
                "capacity": 30,
            },
            {
                "id": "entry",
                "name": "Entry Point",
                "x": 0,
                "y": 260,
                "width": 320,
                "height": 460,
                "capacity": 15,
            },
        ],
    },
}


def get_zone_config(canteen_id: str) -> dict:
    """Get zone configuration for a canteen."""
    if canteen_id not in ZONE_CONFIG:
        raise ValueError(f"Unknown canteen ID: {canteen_id}. Valid IDs: {list(ZONE_CONFIG.keys())}")
    return ZONE_CONFIG[canteen_id]


def get_all_canteen_ids() -> list:
    """Return all configured canteen IDs."""
    return list(ZONE_CONFIG.keys())
