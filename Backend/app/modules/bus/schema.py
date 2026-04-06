from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.modules.master.schema import BusTypeResponse, SeatTypeResponse

class BusCreate(BaseModel):
    name: str
    type_id: int
    seat_type_id: Optional[int] = None
    is_ac: bool
    total_seats: int
    
    # New Fields
    source: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    running_type: Optional[str] = "DAILY" # DAILY, ALTERNATE_DAYS, WEEKDAYS, WEEKENDS
    running_days: Optional[str] = None # "Mon,Wed,Fri"
    start_date: Optional[date] = None
    price: Optional[float] = 499.0

class BusResponse(BaseModel):
    id: int
    name: str
    type_id: int
    seat_type_id: Optional[int] = None
    is_ac: bool
    total_seats: int
    agent_id: int
    
    # New Fields
    source: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    running_type: Optional[str] = None
    running_days: Optional[str] = None
    start_date: Optional[date] = None
    price: Optional[float] = None
    
    bus_type: Optional[BusTypeResponse] = None
    seat_type: Optional[SeatTypeResponse] = None

class BusSearchResponse(BaseModel):
    bus: BusResponse
    available: bool
    availability_message: Optional[str] = None
    next_available_date: Optional[date] = None
    pattern_label: str

class BusSearchListResponse(BaseModel):
    search_date: date
    results: List[BusSearchResponse]
    suggestions: Optional[List[BusSearchResponse]] = None
