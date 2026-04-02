from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.dependencies import get_db, RoleChecker
from app.modules.route.schema import RouteCreate, RouteResponse, ScheduleCreate, ScheduleResponse, RouteStoppageCreate, RouteStoppageResponse
from app.modules.route.service import get_or_create_route, create_schedule, get_schedules, delete_schedule, get_popular_routes, add_route_stoppage, get_route_stoppages, delete_route_stoppage
from app.modules.auth.model import User

router = APIRouter()

agent_or_admin = RoleChecker(["agent", "admin"])
admin_only = RoleChecker(["admin"])

@router.post("/{route_id}/stoppages", response_model=RouteStoppageResponse)
def create_stoppage(route_id: int, data: RouteStoppageCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return add_route_stoppage(db, route_id, data)

@router.get("/{route_id}/stoppages", response_model=List[RouteStoppageResponse])
def fetch_stoppages(route_id: int, db: Session = Depends(get_db)):
    return get_route_stoppages(db, route_id)

@router.delete("/stoppages/{stoppage_id}")
def remove_stoppage(stoppage_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = delete_route_stoppage(db, stoppage_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stoppage not found")
    return {"message": "Stoppage deleted successfully"}



@router.post("/route", response_model=RouteResponse)
def add_route(data: RouteCreate, db: Session = Depends(get_db)):
    return get_or_create_route(db, data.source_id, data.destination_id)


@router.post("/schedule", response_model=ScheduleResponse)
def add_schedule(data: ScheduleCreate, db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    return create_schedule(db, data, current_user.id)


@router.get("/schedule/search", response_model=List[ScheduleResponse])
def search_schedules(
    source: Optional[str] = None,
    destination: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return get_schedules(db, source=source, destination=destination)


@router.get("/schedule/my", response_model=List[ScheduleResponse])
def get_my_schedules(db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    return get_schedules(db, agent_id=current_user.id)


@router.delete("/schedule/{schedule_id}")
def remove_schedule(schedule_id: int, db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    deleted = delete_schedule(db, schedule_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found or access denied")
    return {"message": "Schedule deleted successfully"}


@router.get("/popular")
def popular_routes(limit: int = 6, db: Session = Depends(get_db)):
    """
    Returns top routes by booking volume with trending & few-seats-left flags.
    No auth required — public endpoint.
    """
    return get_popular_routes(db, limit=limit)
