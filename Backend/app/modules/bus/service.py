from sqlalchemy.orm import Session
from app.modules.bus.model import Bus

def create_bus(db: Session, data, agent_id: int):
    new_bus = Bus(
        name=data.name,
        type_id=data.type_id,
        seat_type_id=data.seat_type_id,
        is_ac=data.is_ac,
        total_seats=data.total_seats,
        agent_id=agent_id,
        source=data.source,
        destination=data.destination,
        departure_time=data.departure_time,
        arrival_time=data.arrival_time,
        running_type=data.running_type,
        running_days=data.running_days,
        start_date=data.start_date,
        price=data.price
    )
    db.add(new_bus)
    db.commit()
    db.refresh(new_bus)
    return new_bus

def get_buses(db: Session, agent_id: int = None):
    query = db.query(Bus)
    if agent_id:
        query = query.filter(Bus.agent_id == agent_id)
    return query.all()

def update_bus(db: Session, bus_id: int, data, agent_id: int):
    bus = db.query(Bus).filter(Bus.id == bus_id, Bus.agent_id == agent_id).first()
    if not bus:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(bus, k, v)
    db.commit()
    db.refresh(bus)
    return bus

from datetime import date, timedelta
from app.utils.availability import is_available, get_next_available_date, get_pattern_label

def search_buses(db: Session, source: str, destination: str, search_date: date):
    from app.modules.route.model import RouteStoppage, Route, Schedule
    from app.modules.master.model import Stop
    from sqlalchemy.orm import aliased

    # 1. Aliases for source and destination stops
    SrcStop = aliased(Stop)
    DestStop = aliased(Stop)
    SrcRS = aliased(RouteStoppage)
    DestRS = aliased(RouteStoppage)

    # 2. Find schedules whose Route satisfies the segment search
    # Logic: Join Schedule -> Route -> RouteStoppages (twice)
    # Match stop names and validate sequence order
    query = (
        db.query(Schedule, SrcRS.price_from_start, DestRS.price_from_start)
        .join(Route, Schedule.route_id == Route.id)
        .join(SrcRS, Route.id == SrcRS.route_id)
        .join(SrcStop, SrcRS.stop_id == SrcStop.id)
        .join(DestRS, Route.id == DestRS.route_id)
        .join(DestStop, DestRS.stop_id == DestStop.id)
        .filter(SrcStop.name.ilike(f"%{source}%"))
        .filter(DestStop.name.ilike(f"%{destination}%"))
        .filter(SrcRS.stop_order < DestRS.stop_order)
    )

    schedules_with_prices = query.all()
    results = []

    for sch, src_p, dest_p in schedules_with_prices:
        bus = sch.bus
        if not bus: continue
        
        available = is_available(bus, search_date)
        next_date = None
        message = None
        
        if not available:
            next_date = get_next_available_date(bus, search_date)
            message = f"Bus not available on selected date. Next available date: {next_date}"
        
        segment_price = max(0.0, float(dest_p - src_p))
        
        results.append({
            "bus": bus,
            "available": available,
            "availability_message": message,
            "next_available_date": next_date,
            "pattern_label": get_pattern_label(bus),
            "segment_price": segment_price
        })

    # 3. Fallback Suggestions logic: find buses for the same destination stop
    suggestions = []
    if not results:
        # Find any route containing the destination stop
        alt_query = (
            db.query(Schedule, DestRS.price_from_start)
            .join(Route, Schedule.route_id == Route.id)
            .join(DestRS, Route.id == DestRS.route_id)
            .join(DestStop, DestRS.stop_id == DestStop.id)
            .filter(DestStop.name.ilike(f"%{destination}%"))
            .limit(5)
        )
        
        alt_schedules = alt_query.all()
        for sch, dest_p in alt_schedules:
            bus = sch.bus
            if not bus: continue
            
            available = is_available(bus, search_date)
            next_date = None if available else get_next_available_date(bus, search_date)
            
            suggestions.append({
                "bus": bus,
                "available": available,
                "availability_message": f"Alternative route passing through {destination}",
                "next_available_date": next_date,
                "pattern_label": get_pattern_label(bus),
                "segment_price": float(dest_p) # Baseline price to destination
            })

    return {
        "search_date": search_date,
        "results": results,
        "suggestions": suggestions
    }

from app.modules.route.model import Schedule
from app.modules.booking.model import Booking

def delete_bus(db: Session, bus_id: int, agent_id: int):
    bus = db.query(Bus).filter(Bus.id == bus_id, Bus.agent_id == agent_id).first()
    if not bus:
        return None
    
    # 1. Find all schedules for this bus
    schedules = db.query(Schedule).filter(Schedule.bus_id == bus_id).all()
    schedule_ids = [s.id for s in schedules]
    
    # 2. Delete bookings associated with these schedules
    if schedule_ids:
        db.query(Booking).filter(Booking.schedule_id.in_(schedule_ids)).delete(synchronize_session=False)
        
    # 3. Delete the schedules
    db.query(Schedule).filter(Schedule.bus_id == bus_id).delete(synchronize_session=False)
    
    # 4. Delete the bus
    db.delete(bus)
    db.commit()
    return bus
