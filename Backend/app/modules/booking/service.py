from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.booking.model import Booking
from app.modules.route.model import Schedule, Route
from app.modules.booking.seat_store import seat_lock_store
from datetime import datetime, timezone

VALID_COUPONS = {
    "FIRST10": 0.10,   # 10 % off
    "SAVE20": 0.20,    # 20 % off
    "BUS50": 0.05,     # 5 % off
}


def get_booked_seats(db: Session, schedule_id: int) -> set:
    """Return the set of seat labels already confirmed-booked in this schedule."""
    bookings = (
        db.query(Booking)
        .filter(Booking.schedule_id == schedule_id, Booking.status != "Cancelled")
        .all()
    )
    booked = set()
    for b in bookings:
        for seat in b.seat_numbers.split(","):
            booked.add(seat.strip())
    return booked


def get_seat_map(db: Session, schedule_id: int, current_user_id: int = None) -> list:
    """
    Build the full seat-status map for a schedule.
    Returns list of {seat, status, locked_by_me, lock_expires_at}.
    """
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule or not schedule.bus:
        return []

    total_seats = schedule.bus.total_seats or 0
    bus_type_obj = schedule.bus.bus_type
    bus_type = (bus_type_obj.name if bus_type_obj else "seater").lower()

    # Generate seat labels (A1-A4 per row for seater, A1-A2 for sleeper)
    cols = 2 if "sleeper" in bus_type else 4
    labels = []
    row = ord("A")
    remaining = total_seats
    while remaining > 0:
        for c in range(1, cols + 1):
            if remaining <= 0:
                break
            labels.append(f"{chr(row)}{c}")
            remaining -= 1
        row += 1

    booked = get_booked_seats(db, schedule_id)
    locked = seat_lock_store.get_locked_seats(schedule_id)
    now = datetime.now(timezone.utc)

    result = []
    for seat in labels:
        if seat in booked:
            result.append({"seat": seat, "status": "booked", "locked_by_me": False, "lock_expires_at": None})
        elif seat in locked:
            info = locked[seat]
            is_mine = (current_user_id is not None and info["user_id"] == current_user_id)
            result.append({
                "seat": seat,
                "status": "locked",
                "locked_by_me": is_mine,
                "lock_expires_at": info["expires_at"].isoformat(),
            })
        else:
            result.append({"seat": seat, "status": "available", "locked_by_me": False, "lock_expires_at": None})

    return result


def create_booking(db: Session, data, user_id: int):
    print(f"Creating booking for user {user_id}, schedule {data.schedule_id}, seats {data.seat_numbers}")
    schedule = db.query(Schedule).filter(Schedule.id == data.schedule_id).first()
    if not schedule:
        print(f"Error: Schedule {data.schedule_id} not found.")
        return {"error": "Schedule not found."}

    requested_seats = [s.strip() for s in data.seat_numbers.split(",") if s.strip()]

    # 1. Check for already-booked seats (DB)
    already_booked = get_booked_seats(db, data.schedule_id)
    conflicts = [s for s in requested_seats if s in already_booked]
    if conflicts:
        print(f"Error: Seats {conflicts} already booked for schedule {data.schedule_id}")
        return {"error": f"Seat(s) {', '.join(conflicts)} already booked."}

    # 2. Check for locks held by other users
    locked = seat_lock_store.get_locked_seats(data.schedule_id)
    lock_conflicts = [
        s for s in requested_seats
        if s in locked and locked[s]["user_id"] != user_id
    ]
    if lock_conflicts:
        print(f"Error: Seats {lock_conflicts} locked by another user")
        return {"error": f"Seat(s) {', '.join(lock_conflicts)} are currently locked by another user."}

    # 3. Dynamic Price Calculation based on segment (boarding/dropping)
    price_per_seat = schedule.price
    if data.boarding_stop_id and data.dropping_stop_id:
        from app.modules.route.model import RouteStoppage
        src_rs = db.query(RouteStoppage).filter(
            RouteStoppage.route_id == schedule.route_id,
            RouteStoppage.stop_id == data.boarding_stop_id
        ).first()
        dest_rs = db.query(RouteStoppage).filter(
            RouteStoppage.route_id == schedule.route_id,
            RouteStoppage.stop_id == data.dropping_stop_id
        ).first()
        
        if src_rs and dest_rs:
            # Calculate segment price from cumulative price_from_start
            segment_price = max(0.0, float(dest_rs.price_from_start - src_rs.price_from_start))
            if segment_price > 0:
                price_per_seat = segment_price

    # 4. Coupon / discount
    discount_pct = 0.0
    if data.coupon_code:
        discount_pct = VALID_COUPONS.get(data.coupon_code.upper(), 0.0)

    num_seats = len(requested_seats)
    base_price = num_seats * price_per_seat
    tax = round(base_price * 0.05, 2)          # 5 % tax
    discount_amount = round(base_price * discount_pct, 2)
    total_price = round(base_price + tax - discount_amount, 2)

    try:
        new_booking = Booking(
            user_id=user_id,
            schedule_id=data.schedule_id,
            seat_numbers=",".join(requested_seats),
            total_price=total_price,
            passenger_name=data.passenger_name,
            passenger_phone=data.passenger_phone,
            passenger_age=data.passenger_age,
            coupon_code=data.coupon_code.upper() if data.coupon_code else None,
            discount_amount=discount_amount,
            boarding_stop_id=data.boarding_stop_id,
            dropping_stop_id=data.dropping_stop_id
        )
        db.add(new_booking)
        db.commit()
        db.refresh(new_booking)
        print(f"Booking {new_booking.id} created successfully.")
    except Exception as e:
        print(f"Database error while creating booking: {str(e)}")
        db.rollback()
        return {"error": f"Internal server error: {str(e)}"}

    # 4. Release seat locks after confirmed booking
    seat_lock_store.release_seats(data.schedule_id, user_id)

    # 5. Record in Ledger
    from app.modules.ledger.service import record_transaction
    record_transaction(db, new_booking, entry_type="CREDIT")

    return new_booking


def get_user_bookings(db: Session, user_id: int):
    return db.query(Booking).filter(Booking.user_id == user_id).all()


def get_all_bookings(db: Session):
    return db.query(Booking).all()


def cancel_booking(db: Session, booking_id: int, user_id: int):
    booking = db.query(Booking).filter(
        Booking.id == booking_id, Booking.user_id == user_id
    ).first()
    if not booking:
        return None
    booking.status = "Cancelled"
    db.commit()
    
    # Record in Ledger as DEBIT
    from app.modules.ledger.service import record_transaction
    record_transaction(db, booking, entry_type="DEBIT")
    
    return booking
