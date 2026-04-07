from sqlalchemy.orm import Session
from sqlalchemy import func
from app.modules.ledger.model import Ledger
from app.modules.booking.model import Booking
from app.modules.route.model import Schedule, Route
from app.modules.bus.model import Bus
from app.modules.auth.model import User
from app.modules.ledger.schema import EarningStat, LedgerSummary
from datetime import datetime, timezone

def record_transaction(db: Session, booking: Booking, entry_type: str = "CREDIT"):
    """
    Records a financial transaction in the ledger for a booking.
    CREDIT: money coming in (confirmed booking)
    DEBIT: money going out (cancelled booking)
    """
    schedule = db.query(Schedule).filter(Schedule.id == booking.schedule_id).first()
    if not schedule:
        return None
    
    # Amount is positive for CREDIT, negative for DEBIT
    amount = booking.total_price if entry_type == "CREDIT" else -booking.total_price
    
    new_entry = Ledger(
        booking_id=booking.id,
        amount=amount,
        entry_type=entry_type,
        agent_id=schedule.agent_id,
        bus_id=schedule.bus_id,
        route_id=schedule.route_id
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

def get_ledger_summary(db: Session):
    """
    Aggregates earnings by Agent, Bus, and Route.
    """
    total_rev = db.query(func.sum(Ledger.amount)).scalar() or 0.0
    total_bookings = db.query(func.count(Ledger.id)).filter(Ledger.entry_type == "CREDIT").scalar() or 0
    
    # 1. By Agent
    agent_stats = db.query(
        User.id, User.name, func.sum(Ledger.amount), func.count(Ledger.id)
    ).join(Ledger, User.id == Ledger.agent_id).group_by(User.id).all()
    
    by_agent = [EarningStat(id=id, name=name, total_earnings=total, booking_count=count) for id, name, total, count in agent_stats]
    
    # 2. By Bus
    bus_stats = db.query(
        Bus.id, Bus.name, func.sum(Ledger.amount), func.count(Ledger.id)
    ).join(Ledger, Bus.id == Ledger.bus_id).group_by(Bus.id).all()
    
    by_bus = [EarningStat(id=id, name=name, total_earnings=total, booking_count=count) for id, name, total, count in bus_stats]
    
    # 3. By Route
    from app.modules.master.model import City
    from sqlalchemy.orm import aliased
    SrcCity = aliased(City)
    DestCity = aliased(City)
    
    route_stats = db.query(
        Route.id, SrcCity.name, DestCity.name, func.sum(Ledger.amount), func.count(Ledger.id)
    ).join(Ledger, Route.id == Ledger.route_id) \
     .join(SrcCity, Route.source_id == SrcCity.id) \
     .join(DestCity, Route.destination_id == DestCity.id) \
     .group_by(Route.id).all()
    
    by_route = [
        EarningStat(id=id, name=f"{src} → {dest}", total_earnings=total, booking_count=count)
        for id, src, dest, total, count in route_stats
    ]
    
    return LedgerSummary(
        total_revenue=total_rev,
        total_bookings=total_bookings,
        by_agent=by_agent,
        by_bus=by_bus,
        by_route=by_route
    )

def get_ledger_history(db: Session):
    return db.query(Ledger).order_by(Ledger.created_at.desc()).all()
