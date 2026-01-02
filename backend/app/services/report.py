from datetime import date
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.report import DailyReport, PeriodEntry
from app.models.user import Role, User
from app.schemas.report import DailyReportCreate, DailyReportFilter


async def create_report(data: DailyReportCreate, current_user: User) -> DailyReport:
    periods = [PeriodEntry(**p.model_dump()) for p in data.periods]

    for period in periods:
        if period.signed and current_user.role != Role.admin and period.subject_teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only sign periods you teach.",
            )

    total_signed = sum(1 for p in periods if p.signed)

    report = DailyReport(
        date=data.date,
        class_name=data.class_name,
        class_teacher_id=data.class_teacher_id,
        periods=periods,
        total_periods_taught=total_signed,
    )
    await report.insert()
    return report


async def get_report(report_id: str) -> DailyReport:
    report = await DailyReport.get(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


async def list_reports(filters: DailyReportFilter) -> List[DailyReport]:
    query = {}
    if filters.class_name:
        query["class_name"] = filters.class_name
    if filters.class_teacher_id:
        query["class_teacher_id"] = filters.class_teacher_id
    if filters.subject_teacher_id:
        query["periods.subject_teacher_id"] = filters.subject_teacher_id
    if filters.start_date and filters.end_date:
        query["date"] = {"$gte": filters.start_date, "$lte": filters.end_date}
    elif filters.start_date:
        query["date"] = {"$gte": filters.start_date}
    elif filters.end_date:
        query["date"] = {"$lte": filters.end_date}

    reports = await DailyReport.find_many(query).to_list()
    return reports
