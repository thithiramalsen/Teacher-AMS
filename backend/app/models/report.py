from datetime import date, datetime
from typing import List

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field, field_validator


class PeriodEntry(BaseModel):
    period_number: int
    subject: str = Field(min_length=1)
    topic: str = Field(min_length=1)
    subject_teacher_id: PydanticObjectId
    signed: bool = False
    remarks: str | None = None

    @field_validator("period_number")
    @classmethod
    def validate_period_number(cls, v: int) -> int:
        if v < 1 or v > 8:
            raise ValueError("period_number must be between 1 and 8")
        return v


class DailyReport(Document):
    date: Indexed(date)  # type: ignore[assignment]
    class_name: str = Field(min_length=1)
    class_teacher_id: PydanticObjectId
    periods: List[PeriodEntry] = Field(min_length=8, max_length=8)
    total_periods_taught: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "daily_reports"
        use_revision = False
        indexes = [
            "date",
            "class_name",
            "class_teacher_id",
        ]

    @field_validator("periods")
    @classmethod
    def validate_periods(cls, periods: List[PeriodEntry]) -> List[PeriodEntry]:
        numbers = [p.period_number for p in periods]
        if sorted(numbers) != list(range(1, 9)):
            raise ValueError("periods must include exactly one entry for period numbers 1-8")
        return periods

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-09-01",
                "class_name": "Grade 10-A",
                "class_teacher_id": "64f6c5c2e13f1af4efc12345",
                "periods": [
                    {
                        "period_number": 1,
                        "subject": "Math",
                        "topic": "Algebra",
                        "subject_teacher_id": "64f6c5c2e13f1af4efc12345",
                        "signed": True,
                        "remarks": "",
                    }
                ] * 8,
                "total_periods_taught": 7,
            }
        }
