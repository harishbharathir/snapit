from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import contextlib

from database import init_db, get_db
from routes import menu, orders, ai_integration, analytics, auth
from services.crowd_service import crowd_service

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    
    # Start background task
    async def update_crowd_task():
        while True:
            async with get_db() as db:
                await crowd_service.update_all_canteens(db)
            await asyncio.sleep(15)
            
    task = asyncio.create_task(update_crowd_task())
    
    yield
    
    # Shutdown
    task.cancel()

app = FastAPI(title='snapit API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(ai_integration.router)
app.include_router(analytics.router)
app.include_router(auth.router)

from fastapi import WebSocket, WebSocketDisconnect
from routes.orders import notification_manager

@app.websocket("/api/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await notification_manager.connect(client_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(client_id, websocket)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Serve frontend build if it exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    # Mount assets and images specifically
    assets_dir = os.path.join(frontend_dist, "assets")
    images_dir = os.path.join(frontend_dist, "images")
    
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    if os.path.exists(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="images")
    
    # Catch-all route to serve index.html for React SPA router
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Ignore paths starting with api/ to prevent blocking 404s
        if catchall.startswith("api"):
            return {"detail": "Not Found"}
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "snapit API", "version": "1.0.0"}
