import re
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pymongo import ReturnDocument
from models import LoginRequest, RegisterRequest, UserResponse, WalletAddRequest
from database import get_db, hash_password, verify_password

router = APIRouter(prefix='/api/auth', tags=['auth'])

@router.post('/register', response_model=UserResponse)
@router.post('/signup', response_model=UserResponse)
async def register(req: RegisterRequest):

    username = req.username.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    role = req.role.lower().strip()
    if role not in ['student', 'staff', 'admin']:
        raise HTTPException(status_code=400, detail="Role must be student, staff, or admin")

    async with get_db() as db:
        # Check if username exists (case-insensitive)
        existing_user = await db.users.find_one({
            "username": {"$regex": f"^{re.escape(username)}$", "$options": "i"}
        })
        if existing_user:
            raise HTTPException(status_code=400, detail="Username is already taken")

        # Check email if provided
        email = req.email.strip().lower() if req.email else None
        if email:
            existing_email = await db.users.find_one({
                "email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}
            })
            if existing_email:
                raise HTTPException(status_code=400, detail="Email is already registered")

        user_id = f"{role}_{uuid.uuid4().hex[:8]}"
        initial_balance = 500.0 if role == 'student' else 0.0

        user_doc = {
            "id": user_id,
            "username": username,
            "email": email or f"{username.lower()}@snapit.edu",
            "password": hash_password(req.password),
            "role": role,
            "wallet_balance": initial_balance,
            "canteen_id": req.canteen_id if role == 'staff' else None,
            "created_at": datetime.now()
        }

        await db.users.insert_one(user_doc)

        return UserResponse(
            id=user_doc["id"],
            username=user_doc["username"],
            email=user_doc.get("email"),
            role=user_doc["role"],
            wallet_balance=user_doc["wallet_balance"],
            canteen_id=user_doc.get("canteen_id")
        )

@router.post('/login', response_model=UserResponse)
async def login(req: LoginRequest):
    login_id = req.username.strip()
    
    async with get_db() as db:
        # Match against username or email (case-insensitive)
        user = await db.users.find_one({
            "$or": [
                {"username": {"$regex": f"^{re.escape(login_id)}$", "$options": "i"}},
                {"email": {"$regex": f"^{re.escape(login_id)}$", "$options": "i"}}
            ]
        })

        if not user or not verify_password(req.password, user.get('password', '')):
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # Upgrade legacy unhashed password to hash on successful login
        if "$" not in user.get('password', ''):
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"password": hash_password(req.password)}}
            )

        return UserResponse(
            id=user['id'],
            username=user['username'],
            email=user.get('email'),
            role=user['role'],
            wallet_balance=float(user.get('wallet_balance', 0)),
            canteen_id=user.get('canteen_id')
        )

@router.post('/wallet/{user_id}')
async def add_wallet(user_id: str, req: WalletAddRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    async with get_db() as db:
        user = await db.users.find_one_and_update(
            {"id": user_id},
            {"$inc": {"wallet_balance": float(req.amount)}},
            return_document=ReturnDocument.AFTER
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return {"wallet_balance": float(user.get('wallet_balance', 0))}
