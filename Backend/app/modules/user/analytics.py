from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.core.dependencies import get_db, RoleChecker
from app.modules.auth.model import User
from app.modules.booking.model import Booking
from app.modules.bus.model import Bus
from app.modules.ledger.model import Ledger
from app.modules.route.model import Schedule

router = APIRouter()
admin_only = RoleChecker(["admin"])
agent_only = RoleChecker(["agent"])
any_auth = RoleChecker(["admin", "agent", "user"])

@router.get("/admin/stats")
async def get_admin_stats(db: Session = Depends(get_db), current_user = Depends(admin_only)):
    """Global stats for the Admin Dashboard."""
    total_agents = db.query(func.count(User.id)).filter(User.role == "agent").scalar() or 0
    total_revenue = db.query(func.sum(Ledger.amount)).scalar() or 0.0
    total_bookings = db.query(func.count(Booking.id)).filter(Booking.status != "Cancelled").scalar() or 0
    
    return {
        "total_agents": total_agents,
        "total_revenue": round(total_revenue, 2),
        "total_bookings": total_bookings
    }

@router.get("/agent/stats")
async def get_agent_stats(db: Session = Depends(get_db), current_user = Depends(agent_only)):
    """Specific stats for the logged-in Agent."""
    bus_count = db.query(func.count(Bus.id)).filter(Bus.agent_id == current_user.id).scalar() or 0
    
    # Revenue from ledger filtered by agent
    agent_revenue = db.query(func.sum(Ledger.amount)).filter(Ledger.agent_id == current_user.id).scalar() or 0.0
    
    # Active bookings count for their buses
    active_bookings = db.query(func.count(Booking.id)) \
        .join(Schedule, Booking.schedule_id == Schedule.id) \
        .filter(Schedule.agent_id == current_user.id, Booking.status != "Cancelled").scalar() or 0
        
    return {
        "bus_count": bus_count,
        "revenue": round(agent_revenue, 2),
        "active_bookings": active_bookings
    }

@router.get("/user/activity")
async def get_user_activity(db: Session = Depends(get_db), current_user = Depends(any_auth)):
    """Recent bookings for the logged-in User."""
    recent_bookings = db.query(Booking) \
        .filter(Booking.user_id == current_user.id) \
        .order_by(Booking.booking_date.desc()).limit(5).all()
        
    return recent_bookings
