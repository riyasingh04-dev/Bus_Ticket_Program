from pydantic import BaseModel
from typing import Optional

class MasterBase(BaseModel):
    name: str

class CityCreate(MasterBase):
    pass

class CityResponse(MasterBase):
    id: int
    class Config:
        from_attributes = True

class BusTypeCreate(MasterBase):
    pass

class BusTypeResponse(MasterBase):
    id: int
    class Config:
        from_attributes = True

class SeatTypeCreate(MasterBase):
    pass

class SeatTypeResponse(MasterBase):
    id: int
    class Config:
        from_attributes = True

class StopCreate(MasterBase):
    pass

class StopResponse(MasterBase):
    id: int
    class Config:
        from_attributes = True

class HotelCreate(MasterBase):
    stop_id: int
    description: Optional[str] = None

class HotelResponse(MasterBase):
    id: int
    stop_id: int
    description: Optional[str] = None
    stop: Optional[StopResponse] = None
    class Config:
        from_attributes = True

class RouteMasterCreate(BaseModel):
    source_id: int
    destination_id: int

class RouteMasterResponse(BaseModel):
    id: int
    source_id: int
    destination_id: int
    source_city: Optional[CityResponse] = None
    destination_city: Optional[CityResponse] = None
    class Config:
        from_attributes = True
