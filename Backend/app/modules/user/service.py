from sqlalchemy.orm import Session
from app.modules.auth.model import User
from app.core.security import hash_password

def create_agent(db: Session, data):
    existing_user = db.query(User).filter(User.email == data.email).first()
    if existing_user:
        return {"error": "Email already registered"}
        
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role="agent"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def list_users(db: Session):
    return db.query(User).all()

def toggle_user_status(db: Session, user_id: int, is_active: bool):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
