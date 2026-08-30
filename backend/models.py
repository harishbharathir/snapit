from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Auth Models ---
class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    wallet_balance: float
    canteen_id: Optional[str] = None

class WalletAddRequest(BaseModel):
    amount: float

# --- Existing Models ---
class CrowdZoneData(BaseModel):
    canteen_id: str
    zone_id: str
    zone_name: str
    people_count: int
    occupancy_percentage: float
    zone_status: str
    x: int
    y: int
    width: int
    height: int

class CanteenResponse(BaseModel):
    id: str
    name: str
    location: str
    image_url: str
    status: str
    crowd_data: Optional[List[CrowdZoneData]] = None

class MenuItem(BaseModel):
    id: int
    canteen_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    available: bool
    inventory: int = 50
    is_special: bool = False

class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int

class OrderCreate(BaseModel):
    canteen_id: str
    student_id: str = "student1"
    student_name: str
    payment_method: str = "cash"
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    quantity: int
    price: float
    category: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    canteen_id: str
    student_name: str
    total_amount: float
    status: str
    qr_code: Optional[str] = None
    qr_code_tea: Optional[str] = None
    qr_code_snacks: Optional[str] = None
    tea_status: Optional[str] = None
    snacks_status: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]

class RecommendationResponse(BaseModel):
    canteen_id: str
    canteen_name: str
    occupancy: float
    bottleneck_zone: Optional[str] = None
    reason: str
    estimated_wait: float

class CrowdAnalysisResponse(BaseModel):
    canteen_id: str
    total_people: int
    occupancy_percentage: float
    status: str
    zones: List[CrowdZoneData]
    hottest_zone: Optional[dict] = None
    bottleneck_alert: Optional[str] = None
    recommendations: Optional[dict] = None
    timestamp: datetime

