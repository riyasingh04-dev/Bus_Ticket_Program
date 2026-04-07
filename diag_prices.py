from app.db.database import SessionLocal
from app.modules.bus.model import Bus
from app.modules.route.model import Schedule
from datetime import datetime

db = SessionLocal()
now = datetime.now()
print(f"Current Time: {now}")

schedules = db.query(Schedule).all()
print(f"Total Schedules: {len(schedules)}")
for s in schedules:
    print(f"ID: {s.id}, BusID: {s.bus_id}, Price: {s.price}, DepTime: {s.departure_time}, is_future: {s.departure_time >= now}")

buses = db.query(Bus).all()
print(f"Total Buses: {len(buses)}")
for b in buses:
    print(f"Bus ID: {b.id}, Route: {b.source} -> {b.destination}, Price: {b.price}")

db.close()
