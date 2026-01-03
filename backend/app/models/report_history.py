from datetime import datetime, date
from typing import Any, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field


class ReportHistory(Document):
    report_id: Optional[PydanticObjectId] = None
    class_name: str
    date: date
    actor_id: Optional[PydanticObjectId] = None
    action: str
    payload: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "report_history"
        use_revision = False
        indexes = ["report_id", "class_name", "date"]
