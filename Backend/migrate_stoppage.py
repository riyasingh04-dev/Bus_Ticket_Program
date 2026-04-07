import sys
import os
from sqlalchemy import text
from dotenv import load_dotenv

# Load env from root directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

from sqlalchemy import create_engine

engine = create_engine(DATABASE_URL)

def run_migration():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        with engine.connect() as connection:
            print("Successfully connected. Adding column 'price_from_start' to 'route_stoppages'...")
            
            # MySQL command to add column if it doesn't exist
            # Note: PyMySQL / MySQL syntax
            sql = text("""
                ALTER TABLE route_stoppages 
                ADD COLUMN price_from_start FLOAT DEFAULT 0.0 AFTER stop_order;
            """)
            
            connection.execute(sql)
            connection.commit()
            print("Migration successful: Column added.")
            
    except Exception as e:
        if "Duplicate column name" in str(e) or "1060" in str(e):
            print("Migration skipped: Column already exists.")
        else:
            print(f"Migration failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    run_migration()
