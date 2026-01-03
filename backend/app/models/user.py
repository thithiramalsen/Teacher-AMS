from enum import Enum
from typing import Optional
import secrets
import string

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

    @staticmethod
    def _generate_display_id(prefix: str = "T", length: int = 4) -> str:
        alphabet = string.ascii_uppercase + string.digits
        return f"{prefix}-" + "".join(secrets.choice(alphabet) for _ in range(length))

    async def ensure_display_id(self) -> None:
        if self.display_id:
            return
        for _ in range(8):
            candidate = self._generate_display_id()
            existing = await User.find_one({"display_id": candidate})
            if not existing:
                self.display_id = candidate
                return
        # fallback to longer id if collisions happen
        self.display_id = self._generate_display_id(length=6)
