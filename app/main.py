from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware

from app import models, database
from app.auth import router as auth_router
from app.routers import ws  # WebSocket роутер

app = FastAPI()

# Разрешённые источники
origins = [
    "http://localhost",
    "http://localhost:8000",
    "https://lte-drone-control.onrender.com",
    "https://shewa420-drone-control.onrender.com",
]

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем WebSocket и авторизацию
app.include_router(ws.router)
app.include_router(auth_router)

# Инициализация БД
models.Base.metadata.create_all(bind=database.engine)

# Подключение шаблонов и статики
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Страницы
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/flight-planner", response_class=HTMLResponse)
async def planner(request: Request):
    return templates.TemplateResponse("flight_planner.html", {"request": request})

@app.get("/statistics", response_class=HTMLResponse)
async def statistics(request: Request):
    return templates.TemplateResponse("statistics.html", {"request": request})

@app.get("/settings", response_class=HTMLResponse)
async def settings(request: Request):
    return templates.TemplateResponse("settings.html", {"request": request})

@app.get("/ping")
async def ping():
    return {"status": "ok"}


from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from app import models
from app.database import engine
from app.auth import router as auth_router

models.Base.metadata.create_all(bind=engine)

def create_app():
    app = FastAPI()
    app.add_middleware(SessionMiddleware, secret_key="your-secret-key")

    app.mount("/static", StaticFiles(directory="static"), name="static")
    app.include_router(auth_router)

    return app
