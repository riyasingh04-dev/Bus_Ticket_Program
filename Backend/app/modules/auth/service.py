from sqlalchemy.orm import Session
from app.modules.auth.model import User
from app.core.security import hash_password, verify_password, create_access_token

def register_user(db: Session, data):
    existing_user = db.query(User).filter(User.email == data.email).first()

    if existing_user:
        return {"error": "Email already registered"}

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role   # 👈 ADD THIS
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {"message": "User registered successfully"}

def login_user(db: Session, data):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        return None

    if not verify_password(data.password, user.password_hash):
        return None

    token = create_access_token({
        "user_id": user.id,
        "role": user.role   # 👈 IMPORTANT
    })

    return token

def change_password(db: Session, data):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        return {"error": "User not found"}

    if not verify_password(data.old_password, user.password_hash):
        return {"error": "Old password incorrect"}

    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {"message": "Password changed successfully"}

def forgot_password(db: Session, data):
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        return {"error": "User not found"}

    user.password_hash = hash_password(data.new_password)

    db.commit()

    return {"message": "Password reset successfully"}