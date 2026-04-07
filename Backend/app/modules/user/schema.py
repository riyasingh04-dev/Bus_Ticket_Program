from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "user"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int

    class Config:
        from_attributes = True

class AgentCreate(BaseModel):
    name: str
    email: str
    password: str

class UserStatusUpdate(BaseModel):
    is_active: bool
