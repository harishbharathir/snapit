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
            try:
                async with get_db() as db:
                    await crowd_service.update_all_canteens(db)
            except Exception as crowd_err:
                pass
            await asyncio.sleep(15)
            
    task = asyncio.create_task(update_crowd_task())
    
    yield
    
    # Shutdown
    task.cancel()
    try:
        from database import client
        if client:
            client.close()
    except Exception:
        pass


app = FastAPI(title='snapit API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    from database import is_mock_db, MONGODB_URI
    return {
        "status": "ok",
        "message": "snapit API is operational",
        "version": "1.0.0",
        "database": "in-memory-mock" if is_mock_db() else "mongodb"
    }

app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(ai_integration.router)
app.include_router(analytics.router)
app.include_router(auth.router)

@app.get("/api/health")
async def health():
    return {"message": "snapit API", "version": "1.0.0", "database": "mongodb"}


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
    # Catch-all route to serve static files and React SPA index.html
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Ignore paths starting with api/ to prevent blocking 404s
        if catchall.startswith("api"):
            return {"detail": "Not Found"}
            
        # If the path points to an actual file inside dist, return it
        file_path = os.path.join(frontend_dist, catchall)
        if catchall and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to index.html for React SPA client-side routing
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "snapit API", "version": "1.0.0"}
