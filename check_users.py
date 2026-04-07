from app.db.database import SessionLocal
from app.modules.auth.model import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}")
db.close()
