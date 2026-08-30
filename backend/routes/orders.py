from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
from database import get_db
from models import OrderCreate, OrderResponse, OrderItemResponse
import uuid
import qrcode
import io
import base64

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
        for item in order.items:
            async with db.execute("SELECT price, name, inventory, category FROM menu_items WHERE id = ?", (item.menu_item_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail=f"Menu item {item.menu_item_id} not found")
                if row['inventory'] < item.quantity:
                    raise HTTPException(status_code=400, detail=f"Not enough inventory for {row['name']}")
                total += row['price'] * item.quantity
                if row['category'] == 'Beverages':
                    has_tea = True
                else:
                    has_snacks = True

        # Handle Wallet Payment
        if order.payment_method == 'wallet':
            async with db.execute("SELECT wallet_balance FROM users WHERE id = ?", (order.student_id,)) as cursor:
                user = await cursor.fetchone()
                if not user:
                    raise HTTPException(status_code=404, detail="Student not found")
                if user['wallet_balance'] < total:
                    raise HTTPException(status_code=400, detail="Insufficient wallet balance")
                
                # Deduct balance
                await db.execute("UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?", (total, order.student_id))

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

        # Insert Order
        await db.execute(
            "INSERT INTO orders (id, canteen_id, student_id, student_name, total_amount, qr_code, qr_code_tea, qr_code_snacks, tea_status, snacks_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (order_id, order.canteen_id, order.student_id, order.student_name, total, qr_code_snacks_base64 or qr_code_tea_base64, qr_code_tea_base64, qr_code_snacks_base64, tea_status, snacks_status)
        )
        
        # Insert Items and Deduct Inventory
        order_items_resp = []
        for item in order.items:
            async with db.execute("SELECT price, name FROM menu_items WHERE id = ?", (item.menu_item_id,)) as cursor:
                row = await cursor.fetchone()
                
            await db.execute(
                "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
                (order_id, item.menu_item_id, item.quantity, row['price'])
            )
            
            # Deduct Inventory
            await db.execute(
                "UPDATE menu_items SET inventory = inventory - ? WHERE id = ?",
                (item.quantity, item.menu_item_id)
            )
            
            order_items_resp.append(OrderItemResponse(
                id=0,
                menu_item_id=item.menu_item_id,
                item_name=row['name'],
                quantity=item.quantity,
                price=row['price']
            ))
            
        await db.commit()
            
        # Get creation time
        async with db.execute("SELECT created_at FROM orders WHERE id = ?", (order_id,)) as cursor:
            created_at = (await cursor.fetchone())['created_at']
            
        return OrderResponse(
            id=order_id,
            canteen_id=order.canteen_id,
            student_name=order.student_name,
            total_amount=total,
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
        async with db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)) as cursor:
            order_row = await cursor.fetchone()
            if not order_row:
                raise HTTPException(status_code=404, detail="Order not found")
                
        async with db.execute('''
            SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, m.name as item_name, m.category 
            FROM order_items oi
            JOIN menu_items m ON oi.menu_item_id = m.id
            WHERE oi.order_id = ?
        ''', (order_id,)) as cursor:
            items_rows = await cursor.fetchall()
            
        return OrderResponse(
            **dict(order_row),
            items=[OrderItemResponse(**dict(r)) for r in items_rows]
        )

@router.get('/orders/pending/{canteen_id}')
async def get_pending_orders(canteen_id: str):
    async with get_db() as db:
        async with db.execute("SELECT * FROM orders WHERE canteen_id = ? AND status IN ('PENDING', 'PREPARING') ORDER BY created_at ASC", (canteen_id,)) as cursor:
            orders = [dict(r) for r in await cursor.fetchall()]
            
            for o in orders:
                async with db.execute('''
                    SELECT oi.id, oi.menu_item_id, oi.quantity, oi.price, m.name as item_name, m.category 
                    FROM order_items oi
                    JOIN menu_items m ON oi.menu_item_id = m.id
                    WHERE oi.order_id = ?
                ''', (o['id'],)) as items_cursor:
                    o['items'] = [dict(r) for r in await items_cursor.fetchall()]
            return orders

@router.put('/orders/{order_id}/status')
async def update_status(order_id: str, status: str, type: str = "all"):
    async with get_db() as db:
        # Fetch order details to know which student to notify and current statuses
        async with db.execute("SELECT student_id, student_name, canteen_id, status, tea_status, snacks_status FROM orders WHERE id = ?", (order_id,)) as cursor:
            order_row = await cursor.fetchone()
            if not order_row:
                raise HTTPException(status_code=404, detail="Order not found")
        
        t_status = order_row['tea_status']
        s_status = order_row['snacks_status']

        if type == 'tea':
            t_status = status
            await db.execute("UPDATE orders SET tea_status = ? WHERE id = ?", (status, order_id))
        elif type == 'snacks':
            s_status = status
            await db.execute("UPDATE orders SET snacks_status = ? WHERE id = ?", (status, order_id))
        else:
            if t_status != 'NONE':
                t_status = status
            if s_status != 'NONE':
                s_status = status
            await db.execute("UPDATE orders SET status = ?, tea_status = ?, snacks_status = ? WHERE id = ?", 
                             (status, t_status, s_status, order_id))

        # Check if the entire order should be updated to status (or to SERVED / COMPLETED)
        # If all active parts are marked SERVED, update the main status to SERVED
        active_statuses = []
        if t_status != 'NONE':
            active_statuses.append(t_status)
        if s_status != 'NONE':
            active_statuses.append(s_status)

        new_main_status = order_row['status']

        if active_statuses and all(s == 'SERVED' for s in active_statuses):
            new_main_status = 'SERVED'
            await db.execute("UPDATE orders SET status = 'SERVED' WHERE id = ?", (order_id,))
        elif active_statuses and all(s == 'READY' for s in active_statuses):
            new_main_status = 'READY'
            await db.execute("UPDATE orders SET status = 'READY' WHERE id = ?", (order_id,))
        elif any(s == 'PREPARING' for s in active_statuses):
            new_main_status = 'PREPARING'
            await db.execute("UPDATE orders SET status = 'PREPARING' WHERE id = ?", (order_id,))
        elif type == 'all':
            new_main_status = status
            await db.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))

        await db.commit()

        # Send real-time notification
        await notification_manager.send_personal_message({
            "type": "ORDER_STATUS_UPDATE",
            "order_id": order_id,
            "status": new_main_status,
            "tea_status": t_status,
            "snacks_status": s_status,
            "student_name": order_row['student_name'],
            "canteen_id": order_row['canteen_id'],
            "message": f"Your order is now {new_main_status}!"
        }, order_row['student_id'])

        return {"message": "Status updated successfully"}
