from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from . import models, database
from .auth import router as auth_router
from .admin import router as admin_router

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Підключаємо API
app.include_router(auth_router)
app.include_router(admin_router)

# Статичні HTML файли
app.mount("/", StaticFiles(directory="app/static/frontend", html=True), name="static")
