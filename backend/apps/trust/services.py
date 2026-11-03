from statistics import median

from django.conf import settings
from django.db import transaction

from apps.bookings.models import Booking, BookingStatusHistory
from apps.workers.models import WorkerProfile

from .models import TrustScoreHistory

S = Booking.Status
NEUTRAL_PRIOR = 0.7
MIN_SAMPLE = 3
RATING_PRIOR_WEIGHT = 5
RATING_PRIOR_MEAN = 3.5
VERIFIED_JOBS_CAP = 20
EXPERIENCE_CAP_YEARS = 10
FAST_RESPONSE_MINUTES = 30
SLOW_RESPONSE_MINUTES = 24 * 60
ANSWER_STATUSES = (S.ACCEPTED, S.DECLINED, S.EXPIRED)
FINISHED_STATUSES = (S.COMPLETED, S.AUTO_CLOSED)
TERMINAL_STATUSES = (S.COMPLETED, S.AUTO_CLOSED, S.CANCELLED)


def _completion(bookings):
    accepted = [b for b in bookings if b.accepted_at and b.status in TERMINAL_STATUSES]
    finished = [b for b in accepted if b.status in FINISHED_STATUSES]
    if len(accepted) < MIN_SAMPLE:
        return NEUTRAL_PRIOR, {"finished": len(finished), "accepted": len(accepted), "prior": True}
    return len(finished) / len(accepted), {"finished": len(finished), "accepted": len(accepted)}


def _cancellation(bookings, worker):
    accepted = [b for b in bookings if b.accepted_at]
    cancelled = [
        b for b in accepted if b.status == S.CANCELLED and b.cancelled_by_id == worker.user_id
    ]
    if len(accepted) < MIN_SAMPLE:
        return NEUTRAL_PRIOR, {
            "cancelled": len(cancelled),
            "accepted": len(accepted),
            "prior": True,
        }
    value = 1 - len(cancelled) / len(accepted)
    return value, {"cancelled": len(cancelled), "accepted": len(accepted)}


def _rating(worker):
    overall = [
        float(value)
        for value in worker.reviews.filter(is_invalid=False).values_list("overall", flat=True)
    ]
    bayesian = (RATING_PRIOR_WEIGHT * RATING_PRIOR_MEAN + sum(overall)) / (
        RATING_PRIOR_WEIGHT + len(overall)
    )
    average = round(sum(overall) / len(overall), 2) if overall else None
    return (bayesian - 1) / 4, {"average": average, "count": len(overall)}


def _response_minutes(worker):
    history = BookingStatusHistory.objects.filter(booking__worker=worker).order_by(
        "booking_id", "created_at", "pk"
    )
    asked, minutes = {}, []
    for entry in history:
        if entry.to_status == S.PENDING:
            asked[entry.booking_id] = entry.created_at
        elif entry.to_status in ANSWER_STATUSES and entry.booking_id in asked:
            started = asked.pop(entry.booking_id)
            if entry.to_status == S.EXPIRED:
                minutes.append(SLOW_RESPONSE_MINUTES)
            else:
                minutes.append((entry.created_at - started).total_seconds() / 60)
    return minutes


def _response(worker):
    minutes = _response_minutes(worker)
    if len(minutes) < MIN_SAMPLE:
        return NEUTRAL_PRIOR, {"answered": len(minutes), "prior": True}
    typical = median(minutes)
    span = SLOW_RESPONSE_MINUTES - FAST_RESPONSE_MINUTES
    clamped = min(max(typical, FAST_RESPONSE_MINUTES), SLOW_RESPONSE_MINUTES)
    value = 1 - (clamped - FAST_RESPONSE_MINUTES) / span
    return value, {"answered": len(minutes), "median_minutes": round(typical)}


def calculate(worker):
    bookings = list(Booking.objects.filter(worker=worker))
    verified = sum(1 for b in bookings if b.is_verified)
    factors = {
        "completion": _completion(bookings),
        "rating": _rating(worker),
        "verified_jobs": (
            min(verified / VERIFIED_JOBS_CAP, 1),
            {"verified": verified, "cap": VERIFIED_JOBS_CAP},
        ),
        "cancellation": _cancellation(bookings, worker),
        "response": _response(worker),
        "identity": (
            1.0 if worker.identity_verified else 0.0,
            {"verified": worker.identity_verified},
        ),
        "experience": (
            min(worker.years_experience / EXPERIENCE_CAP_YEARS, 1),
            {"years": worker.years_experience},
        ),
    }
    weights = settings.TRUST_WEIGHTS
    breakdown = [
        {
            "factor": key,
            "weight": weights[key],
            "value": round(value, 3),
            "points": round(weights[key] * value, 1),
            "detail": detail,
        }
        for key, (value, detail) in factors.items()
    ]
    score = round(sum(item["points"] for item in breakdown))
    return score, breakdown


def rating_summary(worker):
    reviews = worker.reviews.filter(is_invalid=False)
    overall = [float(v) for v in reviews.values_list("overall", flat=True)]
    return (round(sum(overall) / len(overall), 2) if overall else 0), len(overall)


@transaction.atomic
def recalculate(worker, trigger):
    worker = WorkerProfile.objects.select_for_update().get(pk=worker.pk)
    score, breakdown = calculate(worker)
    average, count = rating_summary(worker)
    WorkerProfile.objects.filter(pk=worker.pk).update(
        trust_score=score, avg_rating=average, review_count=count
    )
    return TrustScoreHistory.objects.create(
        worker=worker, score=score, breakdown=breakdown, trigger=trigger
    )


def latest_breakdown(worker):
    latest = worker.trust_history.first()
    if latest:
        return latest.breakdown
    return calculate(worker)[1]
