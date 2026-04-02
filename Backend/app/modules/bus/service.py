from sqlalchemy.orm import Session
from app.modules.bus.model import Bus

def create_bus(db: Session, data, agent_id: int):
    new_bus = Bus(
        name=data.name,
        type_id=data.type_id,
        seat_type_id=data.seat_type_id,
        is_ac=data.is_ac,
        total_seats=data.total_seats,
        agent_id=agent_id
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

def delete_bus(db: Session, bus_id: int, agent_id: int):
    bus = db.query(Bus).filter(Bus.id == bus_id, Bus.agent_id == agent_id).first()
    if not bus:
        return None
    db.delete(bus)
    db.commit()
    return bus
