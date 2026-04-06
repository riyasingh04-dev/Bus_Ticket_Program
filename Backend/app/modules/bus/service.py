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
    # 1. Filter buses by source and destination
    # Case-insensitive partial match
    query = db.query(Bus).filter(
        Bus.source.ilike(f"%{source}%"),
        Bus.destination.ilike(f"%{destination}%")
    )
    
    buses = query.all()
    results = []
    
    for b in buses:
        available = is_available(b, search_date)
        next_date = None
        message = None
        
        if not available:
            next_date = get_next_available_date(b, search_date)
            message = f"Bus not available on selected date. Next available date: {next_date}"
        
        results.append({
            "bus": b,
            "available": available,
            "availability_message": message,
            "next_available_date": next_date,
            "pattern_label": get_pattern_label(b)
        })
    
    # 2. Suggestions if no results match both or if all are unavailable
    suggestions = []
    if not results:
        # Try to find alternative buses (e.g. same destination but slightly different source)
        alternative_buses = db.query(Bus).filter(
            Bus.destination.ilike(f"%{destination}%")
        ).limit(5).all()
        
        for b in alternative_buses:
            available = is_available(b, search_date)
            next_date = None if available else get_next_available_date(b, search_date)
            suggestions.append({
                "bus": b,
                "available": available,
                "availability_message": f"Alternative route: {b.source} to {b.destination}",
                "next_available_date": next_date,
                "pattern_label": get_pattern_label(b)
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
