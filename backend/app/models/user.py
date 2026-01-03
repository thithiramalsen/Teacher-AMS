from enum import Enum
from typing import Optional

from beanie import Document
from beanie import Indexed
from pydantic import EmailStr, Field


class Role(str, Enum):
    teacher = "teacher"
    admin = "admin"


class User(Document):
    name: str = Field(min_length=1)
    email: EmailStr = Indexed(unique=True)
    hashed_password: str
    role: Role = Role.teacher
    display_id: Optional[str] = Field(default=None, min_length=4)

    class Settings:
        name = "users"
        use_revision = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "role": "teacher",
            }
        }

    @property
    def id_str(self) -> Optional[str]:
        return str(self.id) if self.id else None
