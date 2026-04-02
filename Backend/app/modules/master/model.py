from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class City(Base):
    __tablename__ = "cities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)

class BusType(Base):
    __tablename__ = "bus_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

class SeatType(Base):
    __tablename__ = "seat_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

class Stop(Base):
    __tablename__ = "stops"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)

class Hotel(Base):
    __tablename__ = "hotels"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    stop_id = Column(Integer, ForeignKey("stops.id"), nullable=False)
    description = Column(String(255), nullable=True)
    
    # Relationship to stop can be handy
    from sqlalchemy.orm import relationship
    stop = relationship("Stop")

