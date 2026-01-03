from datetime import date, datetime
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models.report import DailyReport, PeriodEntry
from app.models.report_history import ReportHistory
from app.models.user import Role, User
from app.schemas.report import DailyReportFilter, DailyReportUpsert, PeriodSignRequest


async def upsert_report(data: DailyReportUpsert, current_user: User) -> DailyReport:
    periods = [PeriodEntry(**p.model_dump()) for p in data.periods]

    # permission: subject teachers can only sign their own periods; admin/class teacher can sign any
    for period in periods:
        if period.signature_status == "signed":
            if current_user.role not in [Role.admin] and period.subject_teacher_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You can only sign periods you teach.",
                )

    existing = await DailyReport.find_one({"date": data.date, "class_name": data.class_name})
    if existing:
        existing.periods = periods
        existing.class_teacher_id = data.class_teacher_id
        existing.status = data.status or existing.status
        existing.last_modified_by = current_user.id
        existing.last_modified_at = datetime.utcnow()
        existing.recompute_totals()
        await existing.save()
        await _log_history(existing, current_user.id, "update", data.model_dump())
        return existing

    report = DailyReport(
        date=data.date,
        class_name=data.class_name,
        class_teacher_id=data.class_teacher_id,
        periods=periods,
        status=data.status or "draft",
        last_modified_by=current_user.id,
        last_modified_at=datetime.utcnow(),
    )
    report.recompute_totals()
    await report.insert()
    await _log_history(report, current_user.id, "create", data.model_dump())
    return report


async def get_report(report_id: str) -> DailyReport:
    report = await DailyReport.get(report_id)
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


async def get_report_by_class_and_date(class_name: str, report_date: date) -> Optional[DailyReport]:
    return await DailyReport.find_one({"class_name": class_name, "date": report_date})


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

    reports = await DailyReport.find_many(query).sort("-date").to_list()
    return reports


async def sign_period(report_id: str, period_number: int, payload: PeriodSignRequest, current_user: User) -> DailyReport:
    report = await get_report(report_id)
    period = next((p for p in report.periods if p.period_number == period_number), None)
    if not period:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Period not found")

    if payload.signature_status == "signed":
        if current_user.role not in [Role.admin] and period.subject_teacher_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only sign your own period")
        period.signature_status = "signed"
        period.signed_by = current_user.id
        period.signed_at = datetime.utcnow()
    else:
        # allow unsign by admin or subject teacher
        if current_user.role not in [Role.admin] and period.subject_teacher_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own period")
        period.signature_status = payload.signature_status
        period.signed_by = None
        period.signed_at = None

    report.last_modified_by = current_user.id
    report.last_modified_at = datetime.utcnow()
    report.recompute_totals()
    await report.save()
    await _log_history(report, current_user.id, f"sign_period_{period_number}", payload.model_dump())
    return report


async def submit_report(report_id: str, current_user: User) -> DailyReport:
    report = await get_report(report_id)
    if current_user.role != Role.admin and report.class_teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the class teacher or admin can submit")
    report.status = "submitted"
    report.last_modified_by = current_user.id
    report.last_modified_at = datetime.utcnow()
    report.recompute_totals()
    await report.save()
    await _log_history(report, current_user.id, "submit", {})
    return report


async def get_history(class_name: str, report_date: date) -> List[ReportHistory]:
    return await ReportHistory.find({"class_name": class_name, "date": report_date}).sort("-created_at").to_list()


async def _log_history(report: DailyReport, actor_id: Optional[PydanticObjectId], action: str, payload: dict):
    entry = ReportHistory(
        report_id=report.id,
        class_name=report.class_name,
        date=report.date,
        actor_id=actor_id,
        action=action,
        payload=payload or {},
    )
    await entry.insert()
