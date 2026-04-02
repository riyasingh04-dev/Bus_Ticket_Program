from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, List
from app.modules.route.schema import ScheduleResponse


# ── Seat Lock ────────────────────────────────────────────────────────────────

class SeatLockRequest(BaseModel):
    schedule_id: int
    seats: List[str]          # e.g. ["A1", "A2"]

class SeatLockResponse(BaseModel):
    locked_seats: List[str]
    expires_at: datetime
    expires_in_seconds: int


# ── Seat Map ─────────────────────────────────────────────────────────────────

class SeatInfo(BaseModel):
    seat: str
    status: str               # "available" | "booked" | "locked"
    locked_by_me: bool = False
    lock_expires_at: Optional[datetime] = None


# ── Booking ───────────────────────────────────────────────────────────────────

class BookingCreate(BaseModel):
    schedule_id: int
    seat_numbers: str         # comma-separated "A1,A2"
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    passenger_age: Optional[int] = None
    coupon_code: Optional[str] = None
    boarding_stop_id: Optional[int] = None
    dropping_stop_id: Optional[int] = None

    @field_validator("seat_numbers")
    @classmethod
    def max_six_seats(cls, v):
        seats = [s.strip() for s in v.split(",") if s.strip()]
        if len(seats) > 6:
            raise ValueError("Maximum 6 seats allowed per booking.")
        if len(seats) == 0:
            raise ValueError("At least one seat must be selected.")
        return v

    @field_validator("passenger_phone")
    @classmethod
    def validate_phone(cls, v):
        if v and (not v.isdigit() or len(v) != 10):
            raise ValueError("Phone number must be exactly 10 digits.")
        return v

# Using Master schema imports inside response models
from app.modules.master.schema import StopResponse

class BookingResponse(BaseModel):
    id: int
    user_id: int
    schedule_id: int
    seat_numbers: str
    total_price: float
    status: str
    booking_date: datetime
    passenger_name: Optional[str] = None
    passenger_phone: Optional[str] = None
    passenger_age: Optional[int] = None
    coupon_code: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    schedule: Optional[ScheduleResponse] = None
    boarding_stop_id: Optional[int] = None
    dropping_stop_id: Optional[int] = None
    boarding_stop: Optional[StopResponse] = None
    dropping_stop: Optional[StopResponse] = None

    class Config:
        from_attributes = True
