from datetime import timedelta

import pytest
from django.utils import timezone

from apps.bookings.models import Booking, BookingStatusHistory, ServiceRequest
from apps.reviews.models import Review
from apps.trust.services import calculate, recalculate

pytestmark = pytest.mark.django_db
S = Booking.Status


def factors(worker):
    return {item["factor"]: item for item in calculate(worker)[1]}


@pytest.fixture
def add_booking(customer_api, request_payload, customer, worker):
    def _add(status, **fields):
        response = customer_api.post("/api/v1/service-requests/", request_payload, format="json")
        return Booking.objects.create(
            service_request=ServiceRequest.objects.get(pk=response.json()["id"]),
            customer=customer,
            worker=worker,
            status=status,
            **fields,
        )

    return _add


def add_review(booking, overall, **fields):
    return Review.objects.create(
        booking=booking,
        customer=booking.customer,
        worker=booking.worker,
        quality=overall,
        professionalism=overall,
        punctuality=overall,
        communication=overall,
        overall=overall,
        would_hire_again=overall >= 4,
        **fields,
    )


def add_answer(booking, to_status, minutes):
    now = timezone.now()
    asked = BookingStatusHistory.objects.create(booking=booking, to_status=S.PENDING)
    answer = BookingStatusHistory.objects.create(
        booking=booking, from_status=S.PENDING, to_status=to_status
    )
    BookingStatusHistory.objects.filter(pk=asked.pk).update(created_at=now)
    BookingStatusHistory.objects.filter(pk=answer.pk).update(
        created_at=now + timedelta(minutes=minutes)
    )


def test_new_worker_gets_neutral_priors(worker):
    result = factors(worker)

    assert result["completion"]["value"] == 0.7
    assert result["completion"]["detail"]["prior"] is True
    assert result["cancellation"]["value"] == 0.7
    assert result["response"]["value"] == 0.7
    assert result["rating"]["value"] == 0.625
    assert result["verified_jobs"]["value"] == 0
    assert sum(item["weight"] for item in result.values()) == 100


def test_strong_worker_scores_high(worker, add_booking):
    worker.identity_verified = True
    worker.years_experience = 12
    worker.save()
    now = timezone.now()
    for _ in range(20):
        booking = add_booking(S.COMPLETED, accepted_at=now, closed_at=now, is_verified=True)
        add_answer(booking, S.ACCEPTED, minutes=5)
        add_review(booking, 5)

    score, breakdown = calculate(worker)

    assert score >= 95
    result = {item["factor"]: item for item in breakdown}
    assert result["completion"]["value"] == 1
    assert result["verified_jobs"]["value"] == 1
    assert result["response"]["value"] == 1


def test_worker_cancellations_lower_score(worker, add_booking):
    now = timezone.now()
    for _ in range(2):
        add_booking(S.CANCELLED, accepted_at=now, cancelled_by=worker.user)
        add_booking(S.COMPLETED, accepted_at=now)

    result = factors(worker)

    assert result["cancellation"]["value"] == 0.5
    assert result["completion"]["value"] == 0.5


def test_customer_cancellation_does_not_count_against_worker(worker, customer, add_booking):
    for _ in range(3):
        add_booking(S.CANCELLED, accepted_at=timezone.now(), cancelled_by=customer)

    assert factors(worker)["cancellation"]["value"] == 1


def test_slow_and_expired_responses(worker, add_booking):
    for status in [S.EXPIRED, S.EXPIRED, S.ACCEPTED]:
        add_answer(add_booking(status), status, minutes=10)

    result = factors(worker)["response"]

    assert result["value"] == 0
    assert result["detail"]["median_minutes"] == 1440


def test_invalid_reviews_ignored(worker, add_booking):
    add_review(add_booking(S.COMPLETED), 1, is_invalid=True)

    recalculate(worker, trigger="test")
    worker.refresh_from_db()

    assert worker.review_count == 0
    assert factors(worker)["rating"]["detail"]["count"] == 0


def test_booking_transitions_recalculate(
    django_capture_on_commit_callbacks, booking, act, worker_api, worker
):
    with django_capture_on_commit_callbacks(execute=True):
        assert act(worker_api, booking["id"], "accept").status_code == 200

    latest = worker.trust_history.first()
    assert latest.trigger == "booking_accepted"
    worker.refresh_from_db()
    assert worker.trust_score == latest.score


def test_trust_history_records_breakdown(worker):
    entry = recalculate(worker, trigger="manual")

    assert entry.score == round(sum(item["points"] for item in entry.breakdown))
    worker.refresh_from_db()
    assert worker.trust_score == entry.score
