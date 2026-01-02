from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.schemas.report import DailyReportCreate, DailyReportFilter, DailyReportOut
from app.services.report import create_report, get_report, list_reports

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=DailyReportOut)
async def submit_report(payload: DailyReportCreate, current_user: User = Depends(get_current_user)) -> DailyReportOut:
    report = await create_report(payload, current_user)
    return DailyReportOut(
        id=str(report.id),
        date=report.date,
        class_name=report.class_name,
        class_teacher_id=report.class_teacher_id,
        periods=[p.model_dump() for p in report.periods],
        total_periods_taught=report.total_periods_taught,
        created_at=report.created_at,
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
        created_at=report.created_at,
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
            created_at=r.created_at,
        )
        for r in reports
    ]
