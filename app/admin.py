from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, database

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/admin/users")
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.post("/admin/approve/{user_id}")
def approve_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_approved = True
    db.commit()
    return {"message": f"User {user.username} approved"}
