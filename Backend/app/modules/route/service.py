from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.route.model import Route, Schedule
from app.modules.booking.model import Booking


def get_or_create_route(db: Session, source_id: int, destination_id: int):
    # Check if route exists
    route = db.query(Route).filter(
        Route.source_id == source_id, Route.destination_id == destination_id
    ).first()
    if not route:
        # Auto-create route if both cities exist (internal helper)
        route = Route(source_id=source_id, destination_id=destination_id)
        db.add(route)
        db.commit()
        db.refresh(route)
    return route

from app.modules.route.model import RouteStoppage
from app.modules.route.schema import RouteStoppageCreate
from fastapi import HTTPException

def add_route_stoppage(db: Session, route_id: int, data: RouteStoppageCreate):
    # Check if stop already exists on route
    existing = db.query(RouteStoppage).filter(
        RouteStoppage.route_id == route_id,
        RouteStoppage.stop_id == data.stop_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stop already exists on this route")
        
    stoppage = RouteStoppage(
        route_id=route_id,
        stop_id=data.stop_id,
        arrival_time=data.arrival_time,
        halt_duration=data.halt_duration,
        hotel_id=data.hotel_id,
        stop_order=data.stop_order
    )
    db.add(stoppage)
    db.commit()
    db.refresh(stoppage)
    return stoppage

def get_route_stoppages(db: Session, route_id: int):
    return db.query(RouteStoppage).filter(
        RouteStoppage.route_id == route_id
    ).order_by(RouteStoppage.stop_order.asc()).all()

def delete_route_stoppage(db: Session, stoppage_id: int):
    stoppage = db.query(RouteStoppage).filter(RouteStoppage.id == stoppage_id).first()
    if stoppage:
        db.delete(stoppage)
        db.commit()
    return stoppage


def create_schedule(db: Session, data, agent_id: int):
    new_schedule = Schedule(
        route_id=data.route_id,
        bus_id=data.bus_id,
        departure_time=data.departure_time,
        arrival_time=data.arrival_time,
        price=data.price,
        agent_id=agent_id,
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule


def get_schedules(db: Session, agent_id: int = None, source: str = None, destination: str = None):
    from app.modules.master.model import City
    from sqlalchemy.orm import aliased
    
    query = db.query(Schedule).join(Route)
    
    if agent_id:
        query = query.filter(Schedule.agent_id == agent_id)
        
    if source:
        SourceCity = aliased(City)
        query = query.join(SourceCity, Route.source_city).filter(SourceCity.name.ilike(f"%{source}%"))
        
    if destination:
        DestCity = aliased(City)
        query = query.join(DestCity, Route.destination_city).filter(DestCity.name.ilike(f"%{destination}%"))
        
    return query.all()


def delete_schedule(db: Session, schedule_id: int, agent_id: int):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id, Schedule.agent_id == agent_id
    ).first()
    if not schedule:
        return None
    db.delete(schedule)
    db.commit()
    return schedule


def get_popular_routes(db: Session, limit: int = 6):
    """
    Returns top `limit` routes ranked by total confirmed bookings.
    Also includes minimum price, total seats, and available seats for each.
    """
    from sqlalchemy import or_
    
    # Count bookings per route (via schedule)
    booking_counts = (
        db.query(
            Schedule.route_id,
            func.count(Booking.id).label("booking_count"),
            func.min(Schedule.price).label("min_price"),
        )
        .join(Booking, Booking.schedule_id == Schedule.id, isouter=True)
        .filter(or_(Booking.id == None, Booking.status != "Cancelled"))
        .group_by(Schedule.route_id)
        .order_by(func.count(Booking.id).desc())
        .limit(limit)
        .all()
    )

    result = []
    for row in booking_counts:
        route = db.query(Route).filter(Route.id == row.route_id).first()
        if not route:
            continue

        # Count total + booked seats across all schedules for this route
        schedules = db.query(Schedule).filter(Schedule.route_id == row.route_id).all()
        total_seats = sum(s.bus.total_seats for s in schedules if s.bus)

        booked_seats = 0
        for s in schedules:
            bookings = db.query(Booking).filter(
                Booking.schedule_id == s.id,
                Booking.status != "Cancelled",
            ).all()
            for b in bookings:
                booked_seats += len(b.seat_numbers.split(","))

        available_seats = max(0, total_seats - booked_seats)
        is_trending = row.booking_count >= 3
        few_seats_left = 0 < available_seats <= 10

        result.append({
            "route_id": route.id,
            "source": route.source_city.name if route.source_city else "Unknown",
            "destination": route.destination_city.name if route.destination_city else "Unknown",
            "booking_count": row.booking_count,
            "min_price": row.min_price or 0,
            "available_seats": available_seats,
            "is_trending": is_trending,
            "few_seats_left": few_seats_left,
        })

    return result
