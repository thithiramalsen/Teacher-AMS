from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.schemas.report import DailyReportFilter, DailyReportOut, DailyReportUpsert, PeriodSignRequest, ReportHistoryOut
from app.services.report import (
    get_history,
    get_report,
    get_report_by_class_and_date,
    list_reports,
    sign_period,
    submit_report,
    upsert_report,
)

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=DailyReportOut)
async def submit_report(payload: DailyReportUpsert, current_user: User = Depends(get_current_user)) -> DailyReportOut:
    report = await upsert_report(payload, current_user)
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        last_modified_by=report.last_modified_by,
        last_modified_at=report.last_modified_at,
    )


@router.get("/current", response_model=DailyReportOut | None)
async def fetch_report_by_class_and_date(
    class_name: str,
    report_date: date,
    current_user: User = Depends(get_current_user),
) -> DailyReportOut | None:
    report = await get_report_by_class_and_date(class_name, report_date)
    if not report:
        return None
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        last_modified_by=report.last_modified_by,
        last_modified_at=report.last_modified_at,
    )


@router.get("/{report_id}", response_model=DailyReportOut)
async def fetch_report(report_id: str, current_user: User = Depends(get_current_user)) -> DailyReportOut:
    report = await get_report(report_id)
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        last_modified_by=report.last_modified_by,
        last_modified_at=report.last_modified_at,
    )


@router.get("", response_model=list[DailyReportOut])
async def fetch_reports(
    class_name: str | None = None,
    class_teacher_id: str | None = None,
    subject_teacher_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
) -> list[DailyReportOut]:
    filters = DailyReportFilter(
        class_name=class_name,
        class_teacher_id=PydanticObjectId(class_teacher_id) if class_teacher_id else None,
        subject_teacher_id=PydanticObjectId(subject_teacher_id) if subject_teacher_id else None,
        start_date=start_date,
        end_date=end_date,
    )
    reports = await list_reports(filters)
    return [
        DailyReportOut(
            id=str(r.id),
            date=r.date,
            class_name=r.class_name,
            class_teacher_id=r.class_teacher_id,
            periods=[p.model_dump() for p in r.periods],
            total_periods_taught=r.total_periods_taught,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
            last_modified_by=r.last_modified_by,
            last_modified_at=r.last_modified_at,
        )
        for r in reports
    ]


@router.patch("/{report_id}/periods/{period_number}/sign", response_model=DailyReportOut)
async def sign_report_period(
    report_id: str,
    period_number: int,
    payload: PeriodSignRequest,
    current_user: User = Depends(get_current_user),
) -> DailyReportOut:
    report = await sign_period(report_id, period_number, payload, current_user)
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        last_modified_by=report.last_modified_by,
        last_modified_at=report.last_modified_at,
    )


@router.post("/{report_id}/submit", response_model=DailyReportOut)
async def submit_final(report_id: str, current_user: User = Depends(get_current_user)) -> DailyReportOut:
    report = await submit_report(report_id, current_user)
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        status=report.status,
        created_at=report.created_at,
        updated_at=report.updated_at,
        last_modified_by=report.last_modified_by,
        last_modified_at=report.last_modified_at,
    )


@router.get("/history/by-class", response_model=list[ReportHistoryOut])
async def fetch_history(
    class_name: str,
    report_date: date,
    current_user: User = Depends(get_current_user),
) -> list[ReportHistoryOut]:
    entries = await get_history(class_name, report_date)
    return [
        ReportHistoryOut(
          report_id=str(e.report_id) if e.report_id else None,
          class_name=e.class_name,
          date=e.date,
          actor_id=e.actor_id,
          action=e.action,
          payload=e.payload,
          created_at=e.created_at,
        ) for e in entries
    ]
