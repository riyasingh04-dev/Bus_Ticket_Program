from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from app.core.dependencies import get_db, RoleChecker, get_current_user
from app.modules.booking.schema import (
    BookingCreate, BookingResponse,
    SeatLockRequest, SeatLockResponse,
)
from app.modules.booking.service import (
    create_booking, get_user_bookings, get_all_bookings,
    cancel_booking, get_seat_map,
)
from app.modules.booking.seat_store import seat_lock_store
from app.modules.auth.model import User

router = APIRouter()

any_role      = RoleChecker(["user", "agent", "admin"])
agent_or_admin = RoleChecker(["agent", "admin"])


# ── Seat Map ─────────────────────────────────────────────────────────────────

@router.get("/seats/{schedule_id}")
def get_seats(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Return full seat map:
      [{seat, status ('available'|'booked'|'locked'), locked_by_me, lock_expires_at}]
    """
    seat_map = get_seat_map(db, schedule_id, current_user.id)
    if not seat_map:
        raise HTTPException(status_code=404, detail="Schedule not found.")
    return seat_map


# ── Lock Seats ───────────────────────────────────────────────────────────────

@router.post("/seats/lock", response_model=SeatLockResponse)
def lock_seats(
    data: SeatLockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role),
):
    """
    Lock seats for current user for 5 minutes.
    Fails if any seat is already locked by another user or already booked.
    """
    from app.modules.booking.service import get_booked_seats

    # Check booked in DB
    booked = get_booked_seats(db, data.schedule_id)
    conflicts = [s for s in data.seats if s in booked]
    if conflicts:
        raise HTTPException(
            status_code=400,
            detail=f"Seat(s) {', '.join(conflicts)} are already booked.",
        )

    # Try to lock
    try:
        expires_at = seat_lock_store.lock_seats(data.schedule_id, data.seats, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    now = datetime.now(timezone.utc)
    seconds_left = int((expires_at - now).total_seconds())

    return SeatLockResponse(
        locked_seats=data.seats,
        expires_at=expires_at,
        expires_in_seconds=seconds_left,
    )


# ── Release Locks ────────────────────────────────────────────────────────────

@router.delete("/seats/lock/{schedule_id}")
def release_locks(
    schedule_id: int,
    current_user: User = Depends(any_role),
):
    """Release all seat locks held by current user in this schedule."""
    seat_lock_store.release_seats(schedule_id, current_user.id)
    return {"message": "Seat locks released."}


# ── Create Booking ────────────────────────────────────────────────────────────

@router.post("/", response_model=BookingResponse)
def book_ticket(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role),
):
    result = create_booking(db, data, current_user.id)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ── User Bookings ─────────────────────────────────────────────────────────────

@router.get("/my", response_model=List[BookingResponse])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role),
):
    return get_user_bookings(db, current_user.id)


@router.get("/all", response_model=List[BookingResponse])
def all_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(agent_or_admin),
):
    return get_all_bookings(db)


# ── Cancel Booking ────────────────────────────────────────────────────────────

@router.put("/{booking_id}/cancel")
def deactivate_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role),
):
    booking = cancel_booking(db, booking_id, current_user.id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found or not owned by you.")
    return {"message": "Booking cancelled successfully."}
