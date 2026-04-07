from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class LedgerBase(BaseModel):
    booking_id: int
    amount: float
    entry_type: str
    agent_id: int
    bus_id: int
    route_id: int

class LedgerCreate(LedgerBase):
    pass

class LedgerResponse(LedgerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EarningStat(BaseModel):
    id: int
    name: str # Name of Agent, Bus, or Route
    total_earnings: float
    booking_count: int

class LedgerSummary(BaseModel):
    total_revenue: float
    total_bookings: int
    by_agent: List[EarningStat]
    by_bus: List[EarningStat]
    by_route: List[EarningStat]
