from typing import List, Optional

from beanie import Document
from beanie import PydanticObjectId
from pydantic import Field


class Subject(Document):
    name: str = Field(..., description="Subject name, unique")
    code: Optional[str] = Field(None, description="Optional short code")
    teacher_ids: List[PydanticObjectId] = Field(default_factory=list, description="Teachers assigned to subject")

    class Settings:
        name = "subjects"
        use_revision = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Mathematics",
                "code": "MATH",
                "teacher_ids": [],
            }
        }
