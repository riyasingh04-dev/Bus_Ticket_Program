from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import hash_password

DATABASE_URL = "mysql+pymysql://root:root@localhost/bus_ticket_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    from app.modules.auth.model import User
    user = db.query(User).filter(User.email == "admin@gmail.com").first()
    if user:
        user.password_hash = hash_password("admin123")
        db.commit()
        print("Password for admin@gmail.com reset to 'admin123'")
    else:
        print("User admin@gmail.com not found")
finally:
    db.close()
