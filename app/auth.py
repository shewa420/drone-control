from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
import hashlib

router = APIRouter()


@router.post("/auth/login")
async def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = get_db()
):
    hashed = hashlib.sha256(password.encode()).hexdigest()
    user = db.query(User).filter_by(username=username, password=hashed).first()

    if not user:
        return HTMLResponse("<h1>Невірний логін або пароль</h1>", status_code=401)

    if not user.is_approved:
        return HTMLResponse("<h1>Обліковий запис ще не підтверджено</h1>", status_code=403)

    if user.is_admin:
        return RedirectResponse("/admin.html", status_code=303)
    else:
        return RedirectResponse("/dashboard.html", status_code=303)


@router.post("/auth/register")
async def register(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = get_db()
):
    existing = db.query(User).filter_by(username=username).first()
    if existing:
        return HTMLResponse("<h1>Користувач уже існує</h1>", status_code=400)

    hashed = hashlib.sha256(password.encode()).hexdigest()
    new_user = User(
        username=username,
        password=hashed,
        is_approved=False,
        is_admin=False
    )
    db.add(new_user)
    db.commit()

    return HTMLResponse("<h1>Реєстрація успішна. Зачекайте підтвердження від адміністратора.</h1>")
