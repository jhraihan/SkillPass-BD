from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.bookings.models import Booking
from apps.reports.models import Report
from apps.reviews.models import Review
from apps.verification.models import Verification
from apps.workers.models import WorkerProfile

from .models import User

S = Booking.Status
FINISHED = (S.COMPLETED, S.AUTO_CLOSED)
PERIODS = (7, 30, 90)
TOP_CATEGORIES = 5


def _users(since):
    by_role = dict(User.objects.values_list("role").annotate(total=Count("pk")))
    return {
        "by_role": {role: by_role.get(role, 0) for role in User.Role.values},
        "new": User.objects.filter(date_joined__gte=since).count(),
        "suspended": User.objects.filter(is_suspended=True).count(),
    }


def _workers():
    visible = WorkerProfile.objects.filter(user__is_active=True, user__is_suspended=False)
    ready = visible.filter(skill_links__isnull=False, area_links__isnull=False).distinct()
    return {
        "total": WorkerProfile.objects.count(),
        "active": ready.count(),
        "available_now": ready.filter(
            availability_status=WorkerProfile.Availability.AVAILABLE
        ).count(),
        "identity_verified": visible.filter(identity_verified=True).count(),
    }


def _daily(bookings, since, days):
    created = dict(
        bookings.annotate(day=TruncDate("created_at")).values_list("day").annotate(n=Count("pk"))
    )
    finished = dict(
        Booking.objects.filter(status__in=FINISHED, closed_at__gte=since)
        .annotate(day=TruncDate("closed_at"))
        .values_list("day")
        .annotate(n=Count("pk"))
    )
    start = timezone.localdate() - timedelta(days=days - 1)
    series = []
    for offset in range(days):
        day = start + timedelta(days=offset)
        series.append(
            {
                "date": day.isoformat(),
                "requested": created.get(day, 0),
                "completed": finished.get(day, 0),
            }
        )
    return series


def _bookings(since, days):
    bookings = Booking.objects.filter(created_at__gte=since)
    by_status = dict(bookings.values_list("status").annotate(n=Count("pk")))
    accepted = bookings.filter(accepted_at__isnull=False)
    decided = accepted.filter(status__in=(*FINISHED, S.CANCELLED)).count()
    finished = accepted.filter(status__in=FINISHED).count()
    return {
        "total": bookings.count(),
        "by_status": {status: by_status.get(status, 0) for status in S.values},
        "completion_rate": round(finished / decided, 3) if decided else None,
        "verified_jobs": bookings.filter(is_verified=True).count(),
        "daily": _daily(bookings, since, days),
    }


def _queues():
    open_reports = Report.objects.filter(status__in=(Report.Status.OPEN, Report.Status.IN_REVIEW))
    return {
        "pending_verifications": Verification.objects.filter(
            status=Verification.Status.PENDING
        ).count(),
        "open_reports": open_reports.filter(is_dispute=False).count(),
        "open_disputes": open_reports.filter(is_dispute=True).count(),
    }


def _reviews(since):
    recent = Review.objects.filter(created_at__gte=since, is_invalid=False)
    summary = recent.aggregate(count=Count("pk"), average=Avg("overall"))
    average = summary["average"]
    return {"count": summary["count"], "average": round(float(average), 2) if average else None}


def _top_categories(since):
    rows = (
        Booking.objects.filter(created_at__gte=since)
        .values(
            "service_request__category__slug",
            "service_request__category__name_en",
            "service_request__category__name_bn",
            "service_request__category__icon",
        )
        .annotate(bookings=Count("pk"), completed=Count("pk", filter=Q(status__in=FINISHED)))
        .order_by("-bookings", "service_request__category__name_en")[:TOP_CATEGORIES]
    )
    return [
        {
            "slug": row["service_request__category__slug"],
            "name_en": row["service_request__category__name_en"],
            "name_bn": row["service_request__category__name_bn"],
            "icon": row["service_request__category__icon"],
            "bookings": row["bookings"],
            "completed": row["completed"],
        }
        for row in rows
    ]


def dashboard_stats(days=30):
    days = days if days in PERIODS else 30
    since = timezone.now() - timedelta(days=days)
    return {
        "period_days": days,
        "generated_at": timezone.now(),
        "users": _users(since),
        "workers": _workers(),
        "bookings": _bookings(since, days),
        "queues": _queues(),
        "reviews": _reviews(since),
        "top_categories": _top_categories(since),
    }
