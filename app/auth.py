from fastapi import APIRouter, Request, Form, Depends, status, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from app import models, database, schemas
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== 📄 HTML СТОРІНКИ ==========

@router.get("/register", response_class=HTMLResponse)
def register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

# ========== ✅ ОБРОБКА ФОРМИ РЕЄСТРАЦІЇ ==========

@router.post("/register")
def register_form(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter_by(username=username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Користувач вже існує")

    hashed_pw = bcrypt.hash(password)
    new_user = models.User(username=username, password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return RedirectResponse(url="/login", status_code=status.HTTP_302_FOUND)

# ========== ✅ ОБРОБКА ФОРМИ ВХОДУ ==========

@router.post("/login")
def login_form(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user or not bcrypt.verify(password, user.password):
        raise HTTPException(status_code=401, detail="Невірне ім'я користувача або пароль")

    # У майбутньому можна встановлювати cookie/token тут
    return RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
