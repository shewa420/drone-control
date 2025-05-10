from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database
import hashlib

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
    new_user = models.User(
        username=user.username,
        password=hashed_password,
        is_admin=False,
        is_approved=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    hashed_password = hashlib.sha256(user.password.encode()).hexdigest()
    db_user = db.query(models.User).filter(
        models.User.username == user.username,
        models.User.password == hashed_password
    ).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    if not db_user.is_approved:
        raise HTTPException(status_code=403, detail="User not approved")
    return {"message": "Login successful", "user_id": db_user.id, "is_admin": db_user.is_admin}
