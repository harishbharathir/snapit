from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
from database import get_db
from models import OrderCreate, OrderResponse, OrderItemResponse
import uuid
import qrcode
import io
import base64
from datetime import datetime

router = APIRouter(prefix='/api', tags=['orders'])

class ConnectionManager:
    def __init__(self):
        # Map user_id to list of active WebSockets
        self.active_connections: dict = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

notification_manager = ConnectionManager()

def generate_qr(data: str) -> str:
    qr = qrcode.make(data)
    buffer = io.BytesIO()
    qr.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode()

@router.post('/orders', response_model=OrderResponse)
async def create_order(order: OrderCreate):
    order_id = str(uuid.uuid4())
    
    async with get_db() as db:
        # Calculate total and check inventory, also determine categories
        total = 0.0
        has_tea = False
        has_snacks = False
        item_details = []

        for item in order.items:
            menu_item = await db.menu_items.find_one({"id": item.menu_item_id})
            if not menu_item:
                raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")
            if menu_item.get('inventory', 0) < item.quantity:
                raise HTTPException(status_code=400, detail=f"Not enough inventory for {menu_item.get('name')}")
            
            price = float(menu_item['price'])
            total += price * item.quantity
            category = menu_item.get('category', '')
            if category == 'Beverages':
                has_tea = True
            else:
                has_snacks = True
                
            item_details.append({
                "menu_item": menu_item,
                "quantity": item.quantity,
                "price": price
            })

        # Handle Wallet Payment
        if order.payment_method == 'wallet':
            user = await db.users.find_one({"id": order.student_id})
            if not user:
                raise HTTPException(status_code=404, detail="Student not found")
            if float(user.get('wallet_balance', 0)) < total:
                raise HTTPException(status_code=400, detail="Insufficient wallet balance")
            
            # Deduct balance atomically
            await db.users.update_one(
                {"id": order.student_id},
                {"$inc": {"wallet_balance": -total}}
            )

        # Generate separate QR codes depending on what items are ordered
        qr_code_tea_base64 = None
        qr_code_snacks_base64 = None
        tea_status = 'NONE'
        snacks_status = 'NONE'

        if has_tea:
            qr_data_tea = f"ORDER:{order_id}:TEA:{order.student_name}"
            qr_code_tea_base64 = generate_qr(qr_data_tea)
            tea_status = 'PENDING'
        if has_snacks:
            qr_data_snacks = f"ORDER:{order_id}:SNACKS:{order.student_name}"
            qr_code_snacks_base64 = generate_qr(qr_data_snacks)
            snacks_status = 'PENDING'

        # Prepare items response and deduct inventory
        order_items_resp = []
        for d in item_details:
            m = d["menu_item"]
            qty = d["quantity"]
            price = d["price"]
            
            await db.menu_items.update_one(
                {"id": m["id"]},
                {"$inc": {"inventory": -qty}}
            )
            
            order_items_resp.append(OrderItemResponse(
                id=m["id"],
                menu_item_id=m["id"],
                item_name=m["name"],
                quantity=qty,
                price=price,
                category=m.get("category")
            ))

        created_at = datetime.now()

        # Insert Order document into MongoDB
        order_doc = {
            "id": order_id,
            "canteen_id": order.canteen_id,
            "student_id": order.student_id,
            "student_name": order.student_name,
            "total_amount": round(total, 2),
            "status": 'PENDING',
            "qr_code": qr_code_snacks_base64 or qr_code_tea_base64,
            "qr_code_tea": qr_code_tea_base64,
            "qr_code_snacks": qr_code_snacks_base64,
            "tea_status": tea_status,
            "snacks_status": snacks_status,
            "created_at": created_at,
            "items": [item.model_dump() for item in order_items_resp]
        }
        await db.orders.insert_one(order_doc)

        return OrderResponse(
            id=order_id,
            canteen_id=order.canteen_id,
            student_name=order.student_name,
            total_amount=round(total, 2),
            status='PENDING',
            qr_code=qr_code_snacks_base64 or qr_code_tea_base64,
            qr_code_tea=qr_code_tea_base64,
            qr_code_snacks=qr_code_snacks_base64,
            tea_status=tea_status,
            snacks_status=snacks_status,
            created_at=created_at,
            items=order_items_resp
        )

@router.get('/orders/{order_id}', response_model=OrderResponse)
async def get_order(order_id: str):
    async with get_db() as db:
        order_row = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")

        order_dict = dict(order_row)

        items_data = order_dict.pop("items", [])
        return OrderResponse(
            **order_dict,
            items=[OrderItemResponse(**it) for it in items_data]
        )


@router.get('/orders/pending/{canteen_id}')
async def get_pending_orders(canteen_id: str):
    async with get_db() as db:
        orders = await db.orders.find(
            {"canteen_id": canteen_id, "status": {"$in": ['PENDING', 'PREPARING']}},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        return orders

@router.put('/orders/{order_id}/status')
async def update_status(order_id: str, status: str, type: str = "all"):
    async with get_db() as db:
        order_row = await db.orders.find_one({"id": order_id})
        if not order_row:
            raise HTTPException(status_code=404, detail="Order not found")
        
        t_status = order_row.get('tea_status', 'NONE')
        s_status = order_row.get('snacks_status', 'NONE')

        if type == 'tea':
            t_status = status
        elif type == 'snacks':
            s_status = status
        else:
            if t_status != 'NONE':
                t_status = status
            if s_status != 'NONE':
                s_status = status

        active_statuses = []
        if t_status != 'NONE':
            active_statuses.append(t_status)
        if s_status != 'NONE':
            active_statuses.append(s_status)

        new_main_status = order_row.get('status', 'PENDING')

        if active_statuses and all(s == 'SERVED' for s in active_statuses):
            new_main_status = 'SERVED'
        elif active_statuses and all(s == 'READY' for s in active_statuses):
            new_main_status = 'READY'
        elif any(s == 'PREPARING' for s in active_statuses):
            new_main_status = 'PREPARING'
        elif type == 'all':
            new_main_status = status

        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "status": new_main_status,
                "tea_status": t_status,
                "snacks_status": s_status
            }}
        )

        # Send real-time notification via WebSocket
        await notification_manager.send_personal_message({
            "type": "ORDER_STATUS_UPDATE",
            "order_id": order_id,
            "status": new_main_status,
            "tea_status": t_status,
            "snacks_status": s_status,
            "student_name": order_row.get('student_name'),
            "canteen_id": order_row.get('canteen_id'),
            "message": f"Your order is now {new_main_status}!"
        }, order_row.get('student_id', ''))

        return {"message": "Status updated successfully"}
