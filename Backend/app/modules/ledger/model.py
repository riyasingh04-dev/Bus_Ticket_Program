from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.db.database import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

class Ledger(Base):
    __tablename__ = "ledger"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)
    amount = Column(Float, nullable=False)
    # Entry Type: "CREDIT" for money coming in (booking), "DEBIT" for money going out (cancellation/refund)
    entry_type = Column(String(20), default="CREDIT")
    
    # Denormalized fields for quick aggregation by Agent, Bus, and Route
    agent_id = Column(Integer, ForeignKey("users.id"))
    bus_id = Column(Integer, ForeignKey("buses.id"))
    route_id = Column(Integer, ForeignKey("routes.id"))
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    booking = relationship("app.modules.booking.model.Booking")
    agent = relationship("app.modules.auth.model.User")
    bus = relationship("app.modules.bus.model.Bus")
    route = relationship("app.modules.route.model.Route")
