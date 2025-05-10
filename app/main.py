from fastapi import FastAPI
from . import models, database
from .auth import router as auth_router
from .admin import router as admin_router

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()
app.include_router(auth_router)
app.include_router(admin_router)
