from datetime import date, datetime
from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, field_validator


class PeriodIn(BaseModel):
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


class PeriodOut(PeriodIn):
    pass


class DailyReportCreate(BaseModel):
    date: date
    class_name: str = Field(min_length=1)
    class_teacher_id: PydanticObjectId
    periods: List[PeriodIn] = Field(min_length=8, max_length=8)

    @field_validator("periods")
    @classmethod
    def validate_periods(cls, periods: List[PeriodIn]) -> List[PeriodIn]:
        numbers = [p.period_number for p in periods]
        if sorted(numbers) != list(range(1, 9)):
            raise ValueError("periods must include exactly one entry for period numbers 1-8")
        return periods


class DailyReportOut(BaseModel):
    id: str
    date: date
    class_name: str
    class_teacher_id: PydanticObjectId
    periods: List[PeriodOut]
    total_periods_taught: int
    created_at: datetime

    class Config:
        from_attributes = True


class DailyReportFilter(BaseModel):
    class_name: Optional[str] = None
    class_teacher_id: Optional[PydanticObjectId] = None
    subject_teacher_id: Optional[PydanticObjectId] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
