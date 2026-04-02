from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship

class Bus(Base):
    __tablename__ = "buses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    type_id = Column(Integer, ForeignKey("bus_types.id"), nullable=False)
    seat_type_id = Column(Integer, ForeignKey("seat_types.id"), nullable=True)
    is_ac = Column(Boolean, default=False)
    total_seats = Column(Integer)
    agent_id = Column(Integer, ForeignKey("users.id"))
    
    bus_type = relationship("app.modules.master.model.BusType")
    seat_type = relationship("app.modules.master.model.SeatType")
    agent = relationship("app.modules.auth.model.User")
