from typing import List, Optional

from beanie import Document
from beanie import PydanticObjectId
from pydantic import Field


class Classroom(Document):
    name: str = Field(..., description="Classroom label like '11-B'")
    grade: Optional[str] = Field(None, description="Optional grade")
    class_teacher_id: Optional[PydanticObjectId] = Field(None, description="Assigned class teacher")
    subject_ids: List[PydanticObjectId] = Field(default_factory=list, description="Subjects tied to this classroom")

    class Settings:
        name = "classrooms"
        use_revision = False

    class Config:
        json_schema_extra = {
            "example": {
                "name": "11-B",
                "grade": "11",
                "class_teacher_id": None,
                "subject_ids": [],
            }
        }
