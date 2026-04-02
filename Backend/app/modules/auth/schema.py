from pydantic import BaseModel
from typing import Optional

class RegisterSchema(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "user"

class LoginSchema(BaseModel):
    email: str
    password: str

class ChangePasswordSchema(BaseModel):
    email: str
    old_password: str
    new_password: str

class ForgotPasswordSchema(BaseModel):
    email: str
    new_password: str