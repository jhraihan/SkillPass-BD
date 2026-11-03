from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User
from apps.bookings.models import Booking
from apps.reviews.models import Review
from apps.reviews.services import short_name

pytestmark = pytest.mark.django_db
URL = "/api/v1/reviews/"


def test_customer_reviews_completed_job(customer_api, completed, review_payload, worker):
    response = customer_api.post(URL, review_payload(completed), format="json")

    assert response.status_code == 201, response.json()
    body = response.json()
    assert body["overall"] == 4.5
    assert body["customer_name"] == "Nusrat J."
    assert body["category"]["slug"] == "ac-repair"
    worker.refresh_from_db()
    assert (float(worker.avg_rating), worker.review_count) == (4.5, 1)
    assert worker.trust_history.first().trigger == "review_created"


def test_booking_shows_has_review(customer_api, completed, review_payload):
    assert customer_api.get(f"/api/v1/bookings/{completed}/").json()["has_review"] is False
    customer_api.post(URL, review_payload(completed), format="json")
    assert customer_api.get(f"/api/v1/bookings/{completed}/").json()["has_review"] is True


def test_second_review_rejected(customer_api, completed, review_payload):
    customer_api.post(URL, review_payload(completed), format="json")
    response = customer_api.post(URL, review_payload(completed), format="json")

    assert response.status_code == 400
    assert Review.objects.count() == 1


def test_unfinished_job_cannot_be_reviewed(customer_api, booking, review_payload):
    response = customer_api.post(URL, review_payload(booking["id"]), format="json")

    assert response.status_code == 400
    assert "booking" in response.json()["errors"]


def test_review_window_closes(customer_api, completed, review_payload):
    Booking.objects.filter(pk=completed).update(closed_at=timezone.now() - timedelta(days=15))

    response = customer_api.post(URL, review_payload(completed), format="json")

    assert response.status_code == 400


def test_other_customer_cannot_review(client_for, completed, review_payload):
    other = User.objects.create_user(phone="01711111111", password="x", full_name="Other")

    response = client_for(other).post(URL, review_payload(completed), format="json")

    assert response.status_code == 403


def test_worker_cannot_review(worker_api, completed, review_payload):
    assert worker_api.post(URL, review_payload(completed), format="json").status_code == 403


@pytest.mark.parametrize("value", [0, 6])
def test_rating_range(customer_api, completed, review_payload, value):
    response = customer_api.post(URL, review_payload(completed, quality=value), format="json")

    assert response.status_code == 400
    assert "quality" in response.json()["errors"]


def test_public_reviews_hide_moderated(api_client, customer_api, completed, review_payload, worker):
    customer_api.post(URL, review_payload(completed), format="json")
    url = f"/api/v1/workers/{worker.id}/reviews/"

    assert api_client.get(url).json()["count"] == 1
    Review.objects.update(is_hidden=True)
    assert api_client.get(url).json()["count"] == 0


def test_work_history_lists_verified_jobs(
    api_client, customer_api, completed, review_payload, worker
):
    customer_api.post(URL, review_payload(completed), format="json")

    body = api_client.get(f"/api/v1/workers/{worker.id}/work-history/").json()

    assert body["count"] == 1
    item = body["results"][0]
    assert item["category"]["slug"] == "ac-repair"
    assert item["area"]["slug"] == "mirpur"
    assert item["customer_name"] == "Nusrat J."
    assert item["review"]["overall"] == 4.5
    assert "House 12" not in str(item)


def test_worker_sees_own_reviews_and_history(worker_api, customer_api, completed, review_payload):
    customer_api.post(URL, review_payload(completed), format="json")

    assert worker_api.get("/api/v1/workers/me/reviews/").json()["count"] == 1
    assert worker_api.get("/api/v1/workers/me/work-history/").json()["count"] == 1
    assert customer_api.get("/api/v1/workers/me/reviews/").status_code == 403


def test_work_history_unknown_worker(api_client):
    assert api_client.get("/api/v1/workers/999999/work-history/").status_code == 404


@pytest.mark.parametrize(
    "name,expected",
    [("Nusrat Jahan", "Nusrat J."), ("Rahim", "Rahim"), ("Md Abdul Karim", "Md K.")],
)
def test_short_name(name, expected):
    assert short_name(name) == expected
