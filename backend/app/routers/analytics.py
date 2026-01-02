from datetime import date

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import DailySummaryResponse, MissedPeriodsResponse, WorkloadResponse
from app.schemas.report import DailyReportFilter
from app.services import analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/missed-periods", response_model=MissedPeriodsResponse)
async def missed_periods(
    class_name: str | None = None,
    class_teacher_id: str | None = None,
    subject_teacher_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
) -> MissedPeriodsResponse:
    filters = DailyReportFilter(
        class_name=class_name,
        class_teacher_id=PydanticObjectId(class_teacher_id) if class_teacher_id else None,
        subject_teacher_id=PydanticObjectId(subject_teacher_id) if subject_teacher_id else None,
        start_date=start_date,
        end_date=end_date,
    )
    items = await analytics.missed_periods(filters)
    return MissedPeriodsResponse(items=items)


@router.get("/workload", response_model=WorkloadResponse)
async def workload(
    class_name: str | None = None,
    class_teacher_id: str | None = None,
    subject_teacher_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
) -> WorkloadResponse:
    filters = DailyReportFilter(
        class_name=class_name,
        class_teacher_id=PydanticObjectId(class_teacher_id) if class_teacher_id else None,
        subject_teacher_id=PydanticObjectId(subject_teacher_id) if subject_teacher_id else None,
        start_date=start_date,
        end_date=end_date,
    )
    items = await analytics.workload(filters)
    return WorkloadResponse(items=items)


@router.get("/daily-summary", response_model=DailySummaryResponse)
async def daily_summary(
    class_name: str | None = None,
    class_teacher_id: str | None = None,
    subject_teacher_id: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    current_user: User = Depends(get_current_user),
) -> DailySummaryResponse:
    filters = DailyReportFilter(
        class_name=class_name,
        class_teacher_id=PydanticObjectId(class_teacher_id) if class_teacher_id else None,
        subject_teacher_id=PydanticObjectId(subject_teacher_id) if subject_teacher_id else None,
        start_date=start_date,
        end_date=end_date,
    )
    items = await analytics.daily_summary(filters)
    return DailySummaryResponse(items=items)
