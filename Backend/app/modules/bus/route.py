from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, RoleChecker
from app.modules.bus.schema import BusCreate, BusResponse
from app.modules.bus.service import create_bus, get_buses, update_bus, delete_bus
from app.modules.auth.model import User

router = APIRouter()

agent_or_admin = RoleChecker(["agent", "admin"])
any_role = RoleChecker(["user", "agent", "admin"])

@router.post("/", response_model=BusResponse)
def add_bus(data: BusCreate, db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    return create_bus(db, data, current_user.id)

@router.get("/", response_model=List[BusResponse])
def get_all_buses(db: Session = Depends(get_db)):
    # Anyone can see buses, or maybe we just want open endpoint 
    return get_buses(db)

@router.get("/my", response_model=List[BusResponse])
def get_my_buses(db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    return get_buses(db, current_user.id)

@router.put("/{bus_id}", response_model=BusResponse)
def modify_bus(bus_id: int, data: BusCreate, db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    updated = update_bus(db, bus_id, data, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Bus not found or access denied")
    return updated

@router.delete("/{bus_id}")
def remove_bus(bus_id: int, db: Session = Depends(get_db), current_user: User = Depends(agent_or_admin)):
    deleted = delete_bus(db, bus_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bus not found or access denied")
    return {"message": "Bus deleted successfully"}
