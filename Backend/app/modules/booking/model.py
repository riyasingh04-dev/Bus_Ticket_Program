from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    seat_numbers = Column(String(200))       # e.g. "A1,A2,B3"
    total_price = Column(Float)
    status = Column(String(50), default="Confirmed")
    booking_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Passenger info (nullable — added via ALTER TABLE migration)
    passenger_name = Column(String(200), nullable=True)
    passenger_phone = Column(String(20), nullable=True)
    passenger_age = Column(Integer, nullable=True)
    coupon_code = Column(String(50), nullable=True)
    discount_amount = Column(Float, nullable=True, default=0.0)

    # Route stoppages
    boarding_stop_id = Column(Integer, ForeignKey("stops.id"), nullable=True)
    dropping_stop_id = Column(Integer, ForeignKey("stops.id"), nullable=True)

    user = relationship("app.modules.auth.model.User")
    schedule = relationship("app.modules.route.model.Schedule")
    
    boarding_stop = relationship("app.modules.master.model.Stop", foreign_keys=[boarding_stop_id])
    dropping_stop = relationship("app.modules.master.model.Stop", foreign_keys=[dropping_stop_id])

