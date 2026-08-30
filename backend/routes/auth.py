from fastapi import APIRouter, HTTPException
from models import LoginRequest, UserResponse, WalletAddRequest
from database import get_db

router = APIRouter(prefix='/api/auth', tags=['auth'])

@router.post('/login', response_model=UserResponse)
async def login(req: LoginRequest):
    async with get_db() as db:
        async with db.execute("SELECT * FROM users WHERE username = ? AND password = ?", (req.username, req.password)) as cursor:
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            return UserResponse(
                id=user['id'],
                username=user['username'],
                role=user['role'],
                wallet_balance=user['wallet_balance'],
                canteen_id=user['canteen_id']
            )

@router.post('/wallet/{user_id}')
async def add_wallet(user_id: str, req: WalletAddRequest):
    async with get_db() as db:
        await db.execute("UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?", (req.amount, user_id))
        await db.commit()
        async with db.execute("SELECT wallet_balance FROM users WHERE id = ?", (user_id,)) as cursor:
            user = await cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return {"wallet_balance": user['wallet_balance']}
