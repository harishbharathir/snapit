"""
Crowd Analyzer Module — snapit Integration

Wraps the existing YOLOv8-based crowd detection logic from crowd_detection.py
and adds zone-awareness. Supports two modes:

1. Real Analysis: Processes video via YOLO person detection and maps detections
   to configured zones (counter, seating, entry).
2. Simulation: Returns realistic fluctuating crowd data for demo purposes
   when YOLO/video is not available.
"""

import os
import random
import time
from datetime import datetime, timezone

# Try to import the zone mapping configuration
from zone_mapping import ZONE_CONFIG, get_zone_config

# Try to import YOLO — graceful fallback if not installed
try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
    from scipy.spatial import distance as sp_distance

    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


class CrowdAnalyzer:
    """
    Analyzes crowd levels in campus canteens using YOLO person detection
    with zone-based mapping, or simulates data for demo mode.
    """

    # Simulation state — persisted across calls for smooth random walk
    _sim_state: dict = {}

    def __init__(self, canteen_id: str, model_path: str = None):
        """
        Initialize analyzer for a specific canteen.

        Args:
            canteen_id: Canteen identifier (A, B, or C)
            model_path: Path to YOLOv8 weights. Defaults to yolov8m.pt
                        in the project root.
        """
        self.canteen_id = canteen_id
        self.config = get_zone_config(canteen_id)
        self.zones = self.config["zones"]

        # Resolve model path
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), "yolov8m.pt")
        self.model_path = model_path

        self._model = None  # Lazy-loaded

    # ------------------------------------------------------------------
    # REAL VIDEO ANALYSIS (uses your existing YOLO detection)
    # ------------------------------------------------------------------

    def _load_model(self):
        """Lazy-load the YOLO model."""
        if not YOLO_AVAILABLE:
            raise RuntimeError(
                "YOLO is not available. Install ultralytics: pip install ultralytics"
            )
        if self._model is None:
            self._model = YOLO(self.model_path)
        return self._model

    def analyze_video(
        self, video_source, max_frames: int = 100, start_frame: int = 0
    ) -> dict:
        """
        Analyze a video source and return zone-level crowd data.

        This reimplements the core logic from crowd_detection.py but adds
        zone mapping — each detected person is assigned to a zone based on
        their centroid position.

        Args:
            video_source: Path to video file, or 0 for webcam.
            max_frames: Maximum number of frames to process.
            start_frame: Frame offset to seek to before reading.

        Returns:
            Full crowd analysis dict with zones, occupancy, recommendations.
        """
        model = self._load_model()
        cap = cv2.VideoCapture(video_source)

        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video source: {video_source}")

        if start_frame > 0:
            cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        # Per-zone people counts (accumulated across sampled frames)
        zone_counts = {z["id"]: [] for z in self.zones}
        frame_idx = 0

        # Tracking state (from original crowd_detection.py)
        tracked_people = {}
        next_id = 0
        INDIVIDUAL_DISTANCE = 20

        while cap.isOpened() and frame_idx < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            results = model(frame)
            detected_centroids = []

            for r in results:
                for box in r.boxes:
                    if int(box.cls) == 0:  # class 0 = person
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
                        detected_centroids.append((cx, cy))

            # Update tracked people (centroid matching from original code)
            updated_people = {}
            matched_ids = set()

            for center in detected_centroids:
                assigned_id = None
                min_dist = INDIVIDUAL_DISTANCE

                for pid, (old_center, age) in tracked_people.items():
                    if pid in matched_ids:
                        continue
                    d = (
                        ((center[0] - old_center[0]) ** 2 + (center[1] - old_center[1]) ** 2)
                        ** 0.5
                    )
                    if d < min_dist:
                        assigned_id = pid
                        min_dist = d

                if assigned_id is not None:
                    updated_people[assigned_id] = (center, 0)
                    matched_ids.add(assigned_id)
                else:
                    updated_people[next_id] = (center, 0)
                    next_id += 1

            tracked_people = {
                pid: (center, age + 1)
                for pid, (center, age) in updated_people.items()
                if age < 10  # FRAME_THRESHOLD
            }

            # Map people to zones for this frame
            frame_zone_counts = {z["id"]: 0 for z in self.zones}
            for _pid, (center, _age) in tracked_people.items():
                cx, cy = center
                for zone in self.zones:
                    if (
                        zone["x"] <= cx <= zone["x"] + zone["width"]
                        and zone["y"] <= cy <= zone["y"] + zone["height"]
                    ):
                        frame_zone_counts[zone["id"]] += 1
                        break  # A person belongs to at most one zone

            for zid, count in frame_zone_counts.items():
                zone_counts[zid].append(count)

            frame_idx += 1

        cap.release()

        # Average counts across frames
        avg_counts = {}
        for zid, counts in zone_counts.items():
            avg_counts[zid] = round(sum(counts) / max(len(counts), 1))

        return self._build_result(avg_counts)

    # ------------------------------------------------------------------
    # SIMULATION MODE (for demo without YOLO)
    # ------------------------------------------------------------------

    def simulate(self) -> dict:
        """
        Generate realistic simulated crowd data with smooth random walk.

        Each canteen has different base crowd levels:
          - Canteen A: Busy (high baseline)
          - Canteen B: Quiet (low baseline)
          - Canteen C: Moderate

        Returns:
            Full crowd analysis dict identical in shape to analyze_video().
        """
        # Initialize simulation state for this canteen if not exists
        if self.canteen_id not in CrowdAnalyzer._sim_state:
            baselines = {
                "A": {"counter": 10, "seating": 22, "entry": 5},
                "B": {"counter": 3, "seating": 8, "entry": 1},
                "C": {"counter": 6, "seating": 14, "entry": 3},
            }
            base = baselines.get(self.canteen_id, baselines["C"])
            CrowdAnalyzer._sim_state[self.canteen_id] = {
                zid: base[zid] for zid in base
            }

        state = CrowdAnalyzer._sim_state[self.canteen_id]

        # Random walk: shift each zone by -2..+2, clamped to reasonable range
        zone_counts = {}
        for zone in self.zones:
            zid = zone["id"]
            current = state.get(zid, 5)
            delta = random.randint(-2, 2)
            new_val = max(0, min(current + delta, zone["capacity"]))
            state[zid] = new_val
            zone_counts[zid] = new_val

        return self._build_result(zone_counts)

    # ------------------------------------------------------------------
    # RESULT BUILDER
    # ------------------------------------------------------------------

    def _build_result(self, zone_counts: dict) -> dict:
        """
        Build the full result dict from zone people counts.

        Args:
            zone_counts: Dict mapping zone_id -> people_count
        """
        zones_data = []
        total_people = 0
        total_capacity = 0
        hottest_zone = None
        hottest_occupancy = -1

        for zone in self.zones:
            zid = zone["id"]
            people = zone_counts.get(zid, 0)
            capacity = zone["capacity"]
            occupancy = round((people / max(capacity, 1)) * 100, 1)
            status = self._get_status(occupancy)

            total_people += people
            total_capacity += capacity

            zone_data = {
                "zone_id": zid,
                "zone_name": zone["name"],
                "x": zone["x"],
                "y": zone["y"],
                "width": zone["width"],
                "height": zone["height"],
                "people_count": people,
                "occupancy_percentage": occupancy,
                "status": status,
            }
            zones_data.append(zone_data)

            if occupancy > hottest_occupancy:
                hottest_occupancy = occupancy
                hottest_zone = zone_data

        overall_occupancy = round(
            (total_people / max(total_capacity, 1)) * 100, 1
        )
        overall_status = self._get_status(overall_occupancy)

        # Build bottleneck alert
        bottleneck_alert = None
        if hottest_zone and hottest_zone["occupancy_percentage"] > 60:
            bottleneck_alert = (
                f"{hottest_zone['zone_name']} is "
                f"{hottest_zone['occupancy_percentage']}% full"
            )

        # Build recommendations
        counter_zone = next(
            (z for z in zones_data if z["zone_id"] == "counter"), None
        )
        seating_zone = next(
            (z for z in zones_data if z["zone_id"] == "seating"), None
        )
        entry_zone = next(
            (z for z in zones_data if z["zone_id"] == "entry"), None
        )

        recommendations = self._build_recommendations(
            counter_zone, seating_zone, entry_zone
        )

        return {
            "canteen_id": self.canteen_id,
            "canteen_name": self.config["name"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_people": total_people,
            "occupancy_percentage": overall_occupancy,
            "status": overall_status,
            "zones": zones_data,
            "hottest_zone": {
                "zone_id": hottest_zone["zone_id"] if hottest_zone else None,
                "zone_name": hottest_zone["zone_name"] if hottest_zone else None,
                "occupancy_percentage": (
                    hottest_zone["occupancy_percentage"] if hottest_zone else 0
                ),
            },
            "bottleneck_alert": bottleneck_alert,
            "recommendations": recommendations,
            "estimated_wait_minutes": (
                self._calculate_wait(counter_zone["people_count"])
                if counter_zone
                else 0
            ),
        }

    @staticmethod
    def _get_status(occupancy: float) -> str:
        if occupancy >= 70:
            return "HIGH"
        elif occupancy >= 40:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def _calculate_wait(counter_people: int) -> float:
        """Estimate wait time in minutes based on counter queue length."""
        return round(counter_people * 0.8 + 2, 1)

    @staticmethod
    def _build_recommendations(counter, seating, entry) -> dict:
        """Generate contextual recommendations for different user roles."""
        recs = {
            "for_students": "",
            "for_staff": "",
            "for_admin": "",
        }

        if counter:
            if counter["status"] == "LOW":
                recs["for_students"] = (
                    "Counter is clear — short queue expected, come now!"
                )
            elif counter["status"] == "MEDIUM":
                recs["for_students"] = (
                    f"Counter has {counter['people_count']} people — "
                    "moderate wait expected"
                )
            else:
                recs["for_students"] = (
                    f"Counter is busy with {counter['people_count']} people — "
                    "consider another canteen"
                )

        if seating:
            if seating["status"] == "HIGH":
                recs["for_staff"] = (
                    "Seating area is filling up — prepare for peak demand, "
                    "ask students to clear tables"
                )
            elif seating["status"] == "MEDIUM":
                recs["for_staff"] = "Seating at moderate levels — keep steady pace"
            else:
                recs["for_staff"] = "Seating is comfortable — normal operations"

        if entry:
            if entry["status"] == "HIGH":
                recs["for_admin"] = (
                    "Entry queue building up — consider redirecting to other canteens"
                )
            elif counter and counter["status"] == "HIGH":
                recs["for_admin"] = (
                    "Counter is bottleneck — consider opening additional counter"
                )
            else:
                recs["for_admin"] = "Operations normal — no action needed"

        return recs


# ------------------------------------------------------------------
# Convenience function for direct use
# ------------------------------------------------------------------

def analyze_canteen(
    canteen_id: str,
    video_source=None,
    max_frames: int = 100,
    use_simulation: bool = False,
    start_frame: int = 0,
) -> dict:
    """
    Convenience function to analyze a canteen.

    Args:
        canteen_id: Canteen ID (A, B, or C)
        video_source: Path to video or 0 for webcam. None = simulate.
        max_frames: Max frames to process in real analysis.
        use_simulation: Force simulation mode.
        start_frame: Frame offset to seek to in real analysis.

    Returns:
        Full crowd analysis result dict.
    """
    analyzer = CrowdAnalyzer(canteen_id)

    if use_simulation or video_source is None:
        return analyzer.simulate()

    if not YOLO_AVAILABLE:
        print(
            "[CrowdAnalyzer] YOLO not available, falling back to simulation"
        )
        return analyzer.simulate()

    return analyzer.analyze_video(video_source, max_frames, start_frame)


if __name__ == "__main__":
    # Quick test
    import json

    print("=== Simulated Crowd Analysis ===\n")
    for cid in ["A", "B", "C"]:
        result = analyze_canteen(cid, use_simulation=True)
        print(f"Canteen {cid}: {result['total_people']} people, "
              f"{result['occupancy_percentage']}% occupancy, "
              f"status={result['status']}")
        for z in result["zones"]:
            print(f"  {z['zone_name']}: {z['people_count']} people, "
                  f"{z['occupancy_percentage']}% ({z['status']})")
        print(f"  Hottest: {result['hottest_zone']['zone_name']}")
        print(f"  Wait: {result['estimated_wait_minutes']} min")
        print(f"  Student tip: {result['recommendations']['for_students']}")
        print()

    # Full JSON output for one canteen
    print("=== Full JSON for Canteen A ===")
    print(json.dumps(analyze_canteen("A", use_simulation=True), indent=2))
