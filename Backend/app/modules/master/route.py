from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_db, RoleChecker
from app.modules.master.schema import (
    CityCreate, CityResponse, BusTypeCreate, BusTypeResponse, 
    SeatTypeCreate, SeatTypeResponse, RouteMasterCreate, RouteMasterResponse
)
from app.modules.master import service

router = APIRouter()
admin_only = RoleChecker(["admin"])

# --- Routes ---
@router.post("/routes", response_model=RouteMasterResponse)
def add_route(data: RouteMasterCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_route(db, data)

@router.get("/routes", response_model=List[RouteMasterResponse])
def fetch_routes(db: Session = Depends(get_db)):
    return service.get_routes(db)

@router.delete("/routes/{route_id}")
def remove_route(route_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_route(db, route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"message": "Route deleted successfully"}

# --- Cities ---
@router.post("/cities", response_model=CityResponse)
def add_city(data: CityCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_city(db, data)

@router.get("/cities", response_model=List[CityResponse])
def fetch_cities(db: Session = Depends(get_db)):
    return service.get_cities(db)

@router.delete("/cities/{city_id}")
def remove_city(city_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_city(db, city_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="City not found")
    return {"message": "City deleted successfully"}

# --- Bus Types ---
@router.post("/bus-types", response_model=BusTypeResponse)
def add_bus_type(data: BusTypeCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_bus_type(db, data)

@router.get("/bus-types", response_model=List[BusTypeResponse])
def fetch_bus_types(db: Session = Depends(get_db)):
    return service.get_bus_types(db)

@router.delete("/bus-types/{bt_id}")
def remove_bus_type(bt_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_bus_type(db, bt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Bus type not found")
    return {"message": "Bus type deleted successfully"}

# --- Seat Types ---
@router.post("/seat-types", response_model=SeatTypeResponse)
def add_seat_type(data: SeatTypeCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_seat_type(db, data)

@router.get("/seat-types", response_model=List[SeatTypeResponse])
def fetch_seat_types(db: Session = Depends(get_db)):
    return service.get_seat_types(db)

@router.delete("/seat-types/{st_id}")
def remove_seat_type(st_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_seat_type(db, st_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Seat type not found")
    return {"message": "Seat type deleted successfully"}

from app.modules.master.schema import StopCreate, StopResponse, HotelCreate, HotelResponse

# --- Stops ---
@router.post("/stops", response_model=StopResponse)
def add_stop(data: StopCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_stop(db, data)

@router.get("/stops", response_model=List[StopResponse])
def fetch_stops(db: Session = Depends(get_db)):
    return service.get_stops(db)

@router.delete("/stops/{stop_id}")
def remove_stop(stop_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_stop(db, stop_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stop not found")
    return {"message": "Stop deleted successfully"}

# --- Hotels ---
@router.post("/hotels", response_model=HotelResponse)
def add_hotel(data: HotelCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_hotel(db, data)

@router.get("/hotels", response_model=List[HotelResponse])
def fetch_hotels(db: Session = Depends(get_db)):
    return service.get_hotels(db)

@router.delete("/hotels/{hotel_id}")
def remove_hotel(hotel_id: int, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    deleted = service.delete_hotel(db, hotel_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Hotel not found")
    return {"message": "Hotel deleted successfully"}
