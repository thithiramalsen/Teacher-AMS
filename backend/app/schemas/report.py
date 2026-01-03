from datetime import date, datetime
from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, field_validator

from app.models.report import SignatureStatus


class PeriodIn(BaseModel):
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


class PeriodOut(PeriodIn):
    pass


class DailyReportUpsert(BaseModel):
    date: date
    class_name: str = Field(min_length=1)  # stores classroom identifier
    class_teacher_id: PydanticObjectId
    periods: List[PeriodIn] = Field(min_length=8, max_length=8)
    status: str = "draft"

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
    status: str
    created_at: datetime
    updated_at: datetime
    last_modified_by: Optional[PydanticObjectId] = None
    last_modified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DailyReportFilter(BaseModel):
    class_name: Optional[str] = None
    class_teacher_id: Optional[PydanticObjectId] = None
    subject_teacher_id: Optional[PydanticObjectId] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PeriodSignRequest(BaseModel):
    signature_status: SignatureStatus


class ReportHistoryOut(BaseModel):
    report_id: Optional[str]
    class_name: str
    date: date
    actor_id: Optional[PydanticObjectId]
    action: str
    payload: dict
    created_at: datetime
