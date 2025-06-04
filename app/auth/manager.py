# app/auth/manager.py

from fastapi_users import FastAPIUsers
from fastapi_users.authentication import CookieTransport, AuthenticationBackend
from fastapi_users.db import SQLAlchemyUserDatabase
from app.models import User, UserDB
from app.database import get_user_db

cookie_transport = CookieTransport(cookie_name="biscuit", cookie_max_age=3600)

auth_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,
    get_strategy=lambda: ...,  # Добавь свою стратегию, например JWTStrategy
)

fastapi_users = FastAPIUsers[User, int](
    get_user_db,
    [auth_backend],
)

current_user = fastapi_users.current_user(optional=True)
