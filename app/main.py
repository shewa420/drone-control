from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

# Статичні файли (CSS, JS, images)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Шаблони
templates = Jinja2Templates(directory="app/templates")

# Головна сторінка (опціонально)
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Панель керування
@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

# WebSocket для Raspberry Pi
@app.websocket("/ws/pi")
async def websocket_pi(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            print("RC data from client:", data)  # або парсинг JSON
    except WebSocketDisconnect:
        print("❌ WebSocket розірвано")
@app.get("/flight-planner", response_class=HTMLResponse)
async def planner(request: Request):
    return templates.TemplateResponse("flight_planner.html", {"request": request})

@app.get("/statistics", response_class=HTMLResponse)
async def statistics(request: Request):
    return templates.TemplateResponse("statistics.html", {"request": request})

@app.get("/settings", response_class=HTMLResponse)
async def settings(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})

from app import models, database
from app.auth import router as auth_router

models.Base.metadata.create_all(bind=database.engine)
app.include_router(auth_router)

@app.get("/ping")
async def ping():
    return {"status": "ok"}

from app.auth import router as auth_router
app.include_router(auth_router)