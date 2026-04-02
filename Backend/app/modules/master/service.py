from sqlalchemy.orm import Session
from app.modules.master.model import City, BusType, SeatType
from app.modules.route.model import Route
from app.modules.master.schema import (
    CityCreate, BusTypeCreate, SeatTypeCreate, 
    RouteMasterCreate, RouteMasterResponse
)
from fastapi import HTTPException



# --- Routes ---
def create_route(db: Session, data: RouteMasterCreate):
    if data.source_id == data.destination_id:
        raise HTTPException(status_code=400, detail="Source and destination cannot be the same")
    
    existing = db.query(Route).filter(
        Route.source_id == data.source_id,
        Route.destination_id == data.destination_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Route already exists")
    
    new_route = Route(source_id=data.source_id, destination_id=data.destination_id)
    db.add(new_route)
    db.commit()
    db.refresh(new_route)
    return new_route

def get_routes(db: Session):
    return db.query(Route).all()

def delete_route(db: Session, route_id: int):
    route = db.query(Route).filter(Route.id == route_id).first()
    if not route:
        return None
    db.delete(route)
    db.commit()
    return route

# --- Cities ---
def create_city(db: Session, data: CityCreate):
    # Case-insensitive check
    existing = db.query(City).filter(City.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="City already exists")
    new_city = City(name=data.name)
    db.add(new_city)
    db.commit()
    db.refresh(new_city)
    return new_city

def get_cities(db: Session):
    return db.query(City).all()

def delete_city(db: Session, city_id: int):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        return None
    db.delete(city)
    db.commit()
    return city

# --- Bus Types ---
def create_bus_type(db: Session, data: BusTypeCreate):
    existing = db.query(BusType).filter(BusType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bus type already exists")
    new_bt = BusType(name=data.name)
    db.add(new_bt)
    db.commit()
    db.refresh(new_bt)
    return new_bt

def get_bus_types(db: Session):
    return db.query(BusType).all()

def delete_bus_type(db: Session, bt_id: int):
    bt = db.query(BusType).filter(BusType.id == bt_id).first()
    if not bt:
        return None
    db.delete(bt)
    db.commit()
    return bt

# --- Seat Types ---
def create_seat_type(db: Session, data: SeatTypeCreate):
    existing = db.query(SeatType).filter(SeatType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Seat type already exists")
    new_st = SeatType(name=data.name)
    db.add(new_st)
    db.commit()
    db.refresh(new_st)
    return new_st

def get_seat_types(db: Session):
    return db.query(SeatType).all()

def delete_seat_type(db: Session, st_id: int):
    st = db.query(SeatType).filter(SeatType.id == st_id).first()
    if not st:
        return None
    db.delete(st)
    db.commit()
    return st

# --- Stops ---
from app.modules.master.model import Stop, Hotel
from app.modules.master.schema import StopCreate, HotelCreate

def create_stop(db: Session, data: StopCreate):
    existing = db.query(Stop).filter(Stop.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stop already exists")
    new_stop = Stop(name=data.name)
    db.add(new_stop)
    db.commit()
    db.refresh(new_stop)
    return new_stop

def get_stops(db: Session):
    return db.query(Stop).all()

def delete_stop(db: Session, stop_id: int):
    stop = db.query(Stop).filter(Stop.id == stop_id).first()
    if not stop:
        return None
    db.delete(stop)
    db.commit()
    return stop

# --- Hotels ---
def create_hotel(db: Session, data: HotelCreate):
    new_hotel = Hotel(
        name=data.name,
        stop_id=data.stop_id,
        description=data.description
    )
    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    return new_hotel

def get_hotels(db: Session):
    return db.query(Hotel).all()

def delete_hotel(db: Session, hotel_id: int):
    hotel = db.query(Hotel).filter(Hotel.id == hotel_id).first()
    if not hotel:
        return None
    db.delete(hotel)
    db.commit()
    return hotel
