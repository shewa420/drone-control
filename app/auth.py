from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from starlette.status import HTTP_302_FOUND
from app.database import SessionLocal
from app.models import User
from app.schemas import UserCreate
from passlib.hash import bcrypt

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/register")
def register_form():
    return {"form": "register"}

@router.post("/register")
def register_user(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    hashed_pw = bcrypt.hash(password)
    user = User(username=username, password=hashed_pw)
    db.add(user)
    db.commit()
    return RedirectResponse("/login", status_code=HTTP_302_FOUND)

@router.get("/login")
def login_form():
    return {"form": "login"}

@router.post("/login")
def login_user(request: Request, username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user or not bcrypt.verify(password, user.password):
        return RedirectResponse("/login", status_code=HTTP_302_FOUND)
    request.session["user"] = user.username
    return RedirectResponse("/", status_code=HTTP_302_FOUND)

@router.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/login", status_code=HTTP_302_FOUND)
