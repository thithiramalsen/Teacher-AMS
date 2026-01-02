from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.models.user import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class TokenPayload(BaseModel):
    sub: str | None = None
    exp: int | None = None


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role

    class Config:
        from_attributes = True


class SignupRequest(LoginRequest):
    name: str
    role: Role = Role.teacher
