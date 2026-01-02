from collections import Counter
from datetime import date
from typing import List

from app.models.report import DailyReport
from app.schemas.analytics import DailySummary, MissedPeriodsItem, WorkloadItem
from app.schemas.report import DailyReportFilter


async def fetch_reports(filters: DailyReportFilter) -> List[DailyReport]:
    return await DailyReport.find_many(build_query(filters)).to_list()


def build_query(filters: DailyReportFilter) -> dict:
    query: dict = {}
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
    return query


async def missed_periods(filters: DailyReportFilter) -> List[MissedPeriodsItem]:
    reports = await fetch_reports(filters)
    return [
        MissedPeriodsItem(
            report_id=str(r.id),
            class_name=r.class_name,
            date=r.date,
            missed_periods=8 - r.total_periods_taught,
        )
        for r in reports
    ]


async def workload(filters: DailyReportFilter) -> List[WorkloadItem]:
    reports = await fetch_reports(filters)
    counter: Counter[str] = Counter()
    for report in reports:
        for period in report.periods:
            if period.signed:
                counter[str(period.subject_teacher_id)] += 1
    return [WorkloadItem(subject_teacher_id=k, periods_taught=v) for k, v in counter.items()]


async def daily_summary(filters: DailyReportFilter) -> List[DailySummary]:
    reports = await fetch_reports(filters)
    summaries: List[DailySummary] = []
    for r in reports:
        missed = 8 - r.total_periods_taught
        summary_text = (
            f"Class {r.class_name} on {r.date.isoformat()}: {r.total_periods_taught}/8 periods taught."
        )
        summaries.append(
            DailySummary(
                class_name=r.class_name,
                date=r.date,
                taught=r.total_periods_taught,
                missed=missed,
                summary=summary_text,
            )
        )
    return summaries
