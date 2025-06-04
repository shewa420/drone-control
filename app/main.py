from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app import models, database
from app.auth import router as auth_router
from app.routers import ws  # WebSocket роутер

models.Base.metadata.create_all(bind=database.engine)

templates = Jinja2Templates(directory="app/templates")

def create_app():
    app = FastAPI()

    # Session middleware для авторизации
    app.add_middleware(SessionMiddleware, secret_key="your-secret-key")

    # CORS
    origins = [
        "http://localhost",
        "http://localhost:8000",
        "https://lte-drone-control.onrender.com",
        "https://shewa420-drone-control.onrender.com",
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Подключение статики и роутерів
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    app.include_router(auth_router)
    app.include_router(ws.router)

    # Сторінки
    @app.get("/", response_class=HTMLResponse, name="main.index")
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

    return app
app = create_app()
