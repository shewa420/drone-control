from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from . import models, database
from .auth import router as auth_router
from .admin import router as admin_router
from .routers import drone  # ✅ підключення роутера керування
from app.routers import ws

models.Base.metadata.create_all(bind=database.engine)

app.include_router(ws.router)

app = FastAPI()

from . import models
from .database import SessionLocal
import hashlib

def create_admin_if_not_exists():
    db = SessionLocal()
    existing = db.query(models.User).filter(models.User.username == "admin").first()
    if not existing:
        admin_user = models.User(
            username="admin",
            password=hashlib.sha256("admin123".encode()).hexdigest(),
            is_admin=True,
            is_approved=True
        )
        db.add(admin_user)
        db.commit()
        print("✅ Адміністратор створений: admin / admin123")
    else:
        print("ℹ️ Адміністратор уже існує")
    db.close()

create_admin_if_not_exists()

# Роути API
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(drone.router)

# Фронтенд
app.mount("/", StaticFiles(directory="app/static/frontend", html=True), name="static")
