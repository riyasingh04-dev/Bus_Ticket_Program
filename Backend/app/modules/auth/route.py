from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.modules.auth.schema import (
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema,
    ForgotPasswordSchema
)
from app.modules.auth.service import (
    register_user,
    login_user,
    change_password,
    forgot_password
)
from app.db.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(data: RegisterSchema, db: Session = Depends(get_db)):
    return register_user(db, data)


@router.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    token = login_user(db, data)

    if not token:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"access_token": token}


@router.post("/change-password")
def change_pass(data: ChangePasswordSchema, db: Session = Depends(get_db)):
    return change_password(db, data)


@router.post("/forgot-password")
def forgot_pass(data: ForgotPasswordSchema, db: Session = Depends(get_db)):
    return forgot_password(db, data)