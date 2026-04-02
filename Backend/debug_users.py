from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "mysql+pymysql://root:root@localhost/bus_ticket_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    from app.modules.auth.model import User
    users = db.query(User).all()
    print("Listing all users in database:")
    print("-" * 80)
    for u in users:
        print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")
    print("-" * 80)
finally:
    db.close()
