from datetime import date, datetime
from typing import List, Literal, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field, field_validator


SignatureStatus = Literal["absent", "signed"]


class PeriodEntry(BaseModel):
    period_number: int
    subject: str = Field(min_length=1)
    topic: str = Field(min_length=1)
    subject_teacher_id: PydanticObjectId
    signature_status: SignatureStatus = "absent"
    signed_by: Optional[PydanticObjectId] = None
    signed_at: Optional[datetime] = None
    remarks: str | None = None

    @field_validator("period_number")
    @classmethod
    def validate_period_number(cls, v: int) -> int:
        if v < 1 or v > 8:
            raise ValueError("period_number must be between 1 and 8")
        return v


class DailyReport(Document):
    date: Indexed(date)  # type: ignore[assignment]
    class_name: str = Field(min_length=1)  # stores classroom identifier selected on frontend
    class_teacher_id: PydanticObjectId
    periods: List[PeriodEntry] = Field(min_length=8, max_length=8)
    total_periods_taught: int = 0
    status: Literal["draft", "submitted"] = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified_by: Optional[PydanticObjectId] = None
    last_modified_at: Optional[datetime] = None

    class Settings:
        name = "daily_reports"
        use_revision = False
        indexes = [
            "date",
            "class_name",
            "class_teacher_id",
            [("date", 1), ("class_name", 1)],  # enforce one report per class per day
        ]

    @field_validator("periods")
    @classmethod
    def validate_periods(cls, periods: List[PeriodEntry]) -> List[PeriodEntry]:
        numbers = [p.period_number for p in periods]
        if sorted(numbers) != list(range(1, 9)):
            raise ValueError("periods must include exactly one entry for period numbers 1-8")
        return periods

    def recompute_totals(self) -> None:
        self.total_periods_taught = sum(1 for p in self.periods if p.signature_status == "signed")
        self.updated_at = datetime.utcnow()

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-09-01",
                "class_name": "CLASSROOM_ID_OR_NAME",
                "class_teacher_id": "64f6c5c2e13f1af4efc12345",
                "status": "draft",
                "periods": [
                    {
                        "period_number": 1,
                        "subject": "Math",
                        "topic": "Algebra",
                        "subject_teacher_id": "64f6c5c2e13f1af4efc12345",
                        "signature_status": "signed",
                        "signed_by": "64f6c5c2e13f1af4efc12345",
                        "signed_at": "2024-09-01T10:00:00Z",
                        "remarks": "",
                    }
                ] * 8,
                "total_periods_taught": 7,
            }
        }
