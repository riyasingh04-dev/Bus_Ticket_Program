from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, RoleChecker
from app.modules.user.schema import User as UserSchema, AgentCreate, UserStatusUpdate
from app.modules.user.service import create_agent, list_users, toggle_user_status
from app.modules.auth.model import User

router = APIRouter()

admin_only = RoleChecker(["admin"])

@router.post("/agent", response_model=UserSchema)
def add_agent(data: AgentCreate, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    result = create_agent(db, data)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.get("/", response_model=List[UserSchema])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    return list_users(db)

@router.put("/{user_id}/status", response_model=UserSchema)
def change_status(user_id: int, data: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(admin_only)):
    updated_user = toggle_user_status(db, user_id, data.is_active)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user
