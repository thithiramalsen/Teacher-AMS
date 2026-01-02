from datetime import date
from typing import Dict, List

from pydantic import BaseModel


class MissedPeriodsItem(BaseModel):
    report_id: str
    class_name: str
    date: date
    missed_periods: int


class WorkloadItem(BaseModel):
    subject_teacher_id: str
    periods_taught: int


class DailySummary(BaseModel):
    class_name: str
    date: date
    taught: int
    missed: int
    summary: str


class MissedPeriodsResponse(BaseModel):
    items: List[MissedPeriodsItem]


class WorkloadResponse(BaseModel):
    items: List[WorkloadItem]


class DailySummaryResponse(BaseModel):
    items: List[DailySummary]
