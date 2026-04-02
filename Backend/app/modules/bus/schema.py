from pydantic import BaseModel
from typing import Optional
from app.modules.master.schema import BusTypeResponse, SeatTypeResponse

class BusCreate(BaseModel):
    name: str
    type_id: int
    seat_type_id: Optional[int] = None
    is_ac: bool
    total_seats: int

class BusResponse(BaseModel):
    id: int
    name: str
    type_id: int
    seat_type_id: Optional[int] = None
    is_ac: bool
    total_seats: int
    agent_id: int
    
    bus_type: Optional[BusTypeResponse] = None
    seat_type: Optional[SeatTypeResponse] = None

    class Config:
        from_attributes = True
