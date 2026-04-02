from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, UniqueConstraint
from app.db.database import Base
from sqlalchemy.orm import relationship

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    destination_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    
    source_city = relationship("app.modules.master.model.City", foreign_keys=[source_id])
    destination_city = relationship("app.modules.master.model.City", foreign_keys=[destination_id])

    __table_args__ = (UniqueConstraint('source_id', 'destination_id', name='_source_destination_uc'),)

class RouteStoppage(Base):
    __tablename__ = "route_stoppages"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    stop_id = Column(Integer, ForeignKey("stops.id"), nullable=False)
    arrival_time = Column(String(50), nullable=False)
    halt_duration = Column(Integer, nullable=False) # Minutes
    hotel_id = Column(Integer, ForeignKey("hotels.id"), nullable=True)
    stop_order = Column(Integer, nullable=False)
    
    route = relationship("app.modules.route.model.Route")
    stop = relationship("app.modules.master.model.Stop")
    hotel = relationship("app.modules.master.model.Hotel")

    __table_args__ = (UniqueConstraint('route_id', 'stop_id', name='_route_stop_uc'),)
class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    bus_id = Column(Integer, ForeignKey("buses.id"))
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    price = Column(Float)
    agent_id = Column(Integer, ForeignKey("users.id"))
    
    route = relationship("app.modules.route.model.Route")
    bus = relationship("app.modules.bus.model.Bus")
    agent = relationship("app.modules.auth.model.User")
