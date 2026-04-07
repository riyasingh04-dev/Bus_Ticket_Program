from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
from app.modules.bus.schema import BusResponse
from app.modules.master.schema import CityResponse, StopResponse, HotelResponse

class RouteStoppageBase(BaseModel):
    stop_id: int
    arrival_time: str
    halt_duration: int
    hotel_id: Optional[int] = None
    stop_order: int
    price_from_start: float = 0.0

class RouteStoppageCreate(RouteStoppageBase):
    pass

class RouteStoppageUpdate(BaseModel):
    stop_id: Optional[int] = None
    arrival_time: Optional[str] = None
    halt_duration: Optional[int] = None
    hotel_id: Optional[int] = None
    stop_order: Optional[int] = None
    price_from_start: Optional[float] = None

class RouteStoppageResponse(RouteStoppageBase):
    id: int
    route_id: int
    stop: Optional[StopResponse] = None
    hotel: Optional[HotelResponse] = None
    
    class Config:
        from_attributes = True

class RouteCreate(BaseModel):

    source_id: int
    destination_id: int

class RouteResponse(BaseModel):
    id: int
    source_id: int
    destination_id: int
    source_city: Optional[CityResponse] = None
    destination_city: Optional[CityResponse] = None
    
    class Config:
        from_attributes = True

class ScheduleBase(BaseModel):
    route_id: int
    bus_id: int
    departure_time: datetime
    arrival_time: datetime
    price: float

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    agent_id: int
    route: Optional[RouteResponse] = None
    bus: Optional[BusResponse] = None
    
    class Config:
        from_attributes = True

class GetOrCreateScheduleRequest(BaseModel):
    bus_id: int
    travel_date: date
