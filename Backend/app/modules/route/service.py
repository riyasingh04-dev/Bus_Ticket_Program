from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.route.model import Route, Schedule
from app.modules.booking.model import Booking
from app.utils.availability import parse_bus_time


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
from app.modules.route.schema import RouteStoppageCreate, RouteStoppageUpdate
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
        stop_order=data.stop_order,
        price_from_start=data.price_from_start
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

def update_route_stoppage(db: Session, stoppage_id: int, data: RouteStoppageUpdate):
    stoppage = db.query(RouteStoppage).filter(RouteStoppage.id == stoppage_id).first()
    if not stoppage:
        raise HTTPException(status_code=404, detail="Stoppage not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(stoppage, k, v)
    db.commit()
    db.refresh(stoppage)
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
    from app.modules.master.model import Stop
    from sqlalchemy.orm import aliased
    from sqlalchemy import and_
    
    query = db.query(Schedule)
    
    if agent_id:
        query = query.filter(Schedule.agent_id == agent_id)
        
    if source or destination:
        # Join with Route and RouteStoppage to filter by stops
        SrcRS = aliased(RouteStoppage)
        DestRS = aliased(RouteStoppage)
        SrcStop = aliased(Stop)
        DestStop = aliased(Stop)
        
        query = query.join(Route, Schedule.route_id == Route.id)
        
        if source:
            query = query.join(SrcRS, Route.id == SrcRS.route_id).join(SrcStop, SrcRS.stop_id == SrcStop.id).filter(SrcStop.name.ilike(f"%{source}%"))
        
        if destination:
            query = query.join(DestRS, Route.id == DestRS.route_id).join(DestStop, DestRS.stop_id == DestStop.id).filter(DestStop.name.ilike(f"%{destination}%"))
            
        if source and destination:
            # Ensure sequence validation
            query = query.filter(SrcRS.stop_order < DestRS.stop_order)
            
            # If both are provided, we can also dynamically calculate the price for this segment in results
            # However, Schedule object itself has a 'price' field which is the base price.
            # For listing purposes, we'll return the schedules that MATCH.
            
    return query.all()


def delete_schedule(db: Session, schedule_id: int, agent_id: int):
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id, Schedule.agent_id == agent_id
    ).first()
    if not schedule:
        return None
        
    # Check for existing bookings to prevent IntegrityError (FK constraint)
    booking_exists = db.query(Booking).filter(
        Booking.schedule_id == schedule_id,
        Booking.status != "Cancelled"
    ).first()
    
    if booking_exists:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete schedule because there are active bookings. Cancel the bookings first."
        )
        
    db.delete(schedule)
    db.commit()
    return schedule


def get_popular_routes(db: Session, limit: int = 6):
    """
    Returns top `limit` routes based on availability in the Bus table.
    Aggregates booking counts from all schedules of those buses.
    """
    from app.modules.bus.model import Bus
    from sqlalchemy import distinct, or_
    
    # 1. Discover all unique routes currently served by buses
    unique_routes_raw = db.query(Bus.source, Bus.destination).distinct().all()
    
    routes_data = []
    for src_name, dest_name in unique_routes_raw:
        if not src_name or not dest_name:
            continue
            
        # 2. Get all buses for this route
        buses = db.query(Bus).filter(Bus.source == src_name, Bus.destination == dest_name).all()
        bus_ids = [b.id for b in buses]
        
        # 3. Calculate metrics for this route
        
        # Total bookings across all schedules for these buses
        booking_count = (
            db.query(func.count(Booking.id))
            .join(Schedule, Booking.schedule_id == Schedule.id)
            .filter(Schedule.bus_id.in_(bus_ids))
            .filter(Booking.status != "Cancelled")
            .scalar() or 0
        )
        
        # Min price from any active/future schedule for this route
        min_price = (
            db.query(func.min(Schedule.price))
            .filter(Schedule.bus_id.in_(bus_ids))
            .filter(func.date(Schedule.departure_time) >= date.today())
            .scalar()
        )
        
        # Fallback to bus min price if no future schedules exist
        if min_price is None:
            min_price = min((b.price for b in buses if b.price), default=499.0)
        
        # 4. Check total vs booked seats for "available_seats" (simplified)
        # We look at all "current/future" schedules
        schedules = db.query(Schedule).filter(Schedule.bus_id.in_(bus_ids)).all()
        total_capacity = sum((b.total_seats or 30) for b in buses) # Baseline if no schedules
        
        # If schedules exist, we can be more accurate
        booked_seats = 0
        if schedules:
            sk_ids = [s.id for s in schedules]
            bookings = db.query(Booking).filter(
                Booking.schedule_id.in_(sk_ids),
                Booking.status != "Cancelled"
            ).all()
            for b in bookings:
                booked_seats += len(b.seat_numbers.split(","))
        
        # Resolve a representative route_id if it exists
        route = db.query(Route).filter(
            Route.source_city.has(name=src_name),
            Route.destination_city.has(name=dest_name)
        ).first()
        
        is_trending = booking_count >= 3
        
        routes_data.append({
            "route_id": route.id if route else f"route-{src_name}-{dest_name}",
            "source": src_name,
            "destination": dest_name,
            "booking_count": booking_count,
            "min_price": min_price,
            "available_seats": max(0, total_capacity - booked_seats),
            "is_trending": is_trending,
            "few_seats_left": 0 < (total_capacity - booked_seats) <= 5
        })

    # 5. Sort by booking count DESC, then min_price ASC
    routes_data.sort(key=lambda x: (-x["booking_count"], x["min_price"]))
    
    return routes_data[:limit]

from datetime import datetime, date, time, timedelta
from app.modules.bus.model import Bus
from app.modules.master.model import City

def get_or_create_bus_schedule(db: Session, bus_id: int, travel_date: date):
    # 1. Fetch bus
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if not bus:
        raise HTTPException(status_code=404, detail="Bus not found")
    
    # 2. Resolve cities
    source_city = db.query(City).filter(City.name == bus.source).first()
    dest_city = db.query(City).filter(City.name == bus.destination).first()
    
    if not source_city or not dest_city:
        raise HTTPException(status_code=400, detail=f"Cities {bus.source} or {bus.destination} not found in master data")
    
    # 3. Get or Create Route
    route = get_or_create_route(db, source_city.id, dest_city.id)
    
    dep_dt = parse_bus_time(bus.departure_time, travel_date)
    arr_dt = parse_bus_time(bus.arrival_time, travel_date)
    # If arrival is same or before departure, assume it's the next day
    if arr_dt <= dep_dt:
        arr_dt += timedelta(days=1)
        
    # 5. Check for existing schedule
    # We look for a schedule for this bus on this specific day
    # Since schedules usually represent a single departure, we check the date part
    existing = db.query(Schedule).filter(
        Schedule.bus_id == bus_id,
        func.date(Schedule.departure_time) == travel_date
    ).first()
    
    if existing:
        return existing
        
    # 6. Create new schedule
    new_schedule = Schedule(
        route_id=route.id,
        bus_id=bus_id,
        departure_time=dep_dt,
        arrival_time=arr_dt,
        price=bus.price or 499.0, # Use bus price
        agent_id=bus.agent_id
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return new_schedule
