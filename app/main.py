# app/main.py

from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app import models, database
from app.auth import router as auth_router
from app.routers import ws
from app.models import UserDB
from app.auth.manager import fastapi_users, current_user  # ты должен создать fastapi_users и current_user в отдельном auth/manager.py

models.Base.metadata.create_all(bind=database.engine)

templates = Jinja2Templates(directory="app/templates")

def create_app():
    app = FastAPI()

    # Сессии и CORS
    app.add_middleware(SessionMiddleware, secret_key="super-secret-key")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost",
            "http://localhost:8000",
            "https://lte-drone-control.onrender.com",
            "https://shewa420-drone-control.onrender.com",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Подключения
    app.mount("/static", StaticFiles(directory="app/static"), name="static")
    app.include_router(auth_router)
    app.include_router(ws.router)

    # Роуты
    @app.get("/", response_class=HTMLResponse)
    async def index(request: Request, user: UserDB = Depends(current_user)):
        return templates.TemplateResponse("index.html", {"request": request, "current_user": user})

    @app.get("/dashboard", response_class=HTMLResponse)
    async def dashboard(request: Request, user: UserDB = Depends(current_user)):
        return templates.TemplateResponse("dashboard.html", {"request": request, "current_user": user})

    @app.get("/flight-planner", response_class=HTMLResponse)
    async def planner(request: Request, user: UserDB = Depends(current_user)):
        return templates.TemplateResponse("flight_planner.html", {"request": request, "current_user": user})

    @app.get("/statistics", response_class=HTMLResponse)
    async def statistics(request: Request, user: UserDB = Depends(current_user)):
        return templates.TemplateResponse("statistics.html", {"request": request, "current_user": user})

    @app.get("/settings", response_class=HTMLResponse)
    async def settings(request: Request, user: UserDB = Depends(current_user)):
        return templates.TemplateResponse("settings.html", {"request": request, "current_user": user})

    @app.get("/ping")
    async def ping():
        return {"status": "ok"}

    return app


# финальный вызов
app = create_app()
