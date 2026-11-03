import pytest

from apps.bookings.models import Booking, ServiceRequest
from apps.workers.models import WorkerProfile

pytestmark = pytest.mark.django_db


def status_of(booking_id):
    return Booking.objects.get(pk=booking_id).status


def test_happy_path_creates_verified_job(customer_api, worker_api, booking, act, worker):
    booking_id = booking["id"]
    assert booking["status"] == "PENDING"

    for action, expected in [
        ("accept", "ACCEPTED"),
        ("on-the-way", "ON_THE_WAY"),
        ("start", "IN_PROGRESS"),
        ("mark-complete", "AWAITING_CONFIRMATION"),
    ]:
        response = act(worker_api, booking_id, action)
        assert response.status_code == 200, response.json()
        assert response.json()["status"] == expected

    confirmed = act(customer_api, booking_id, "confirm").json()
    assert confirmed["status"] == "COMPLETED"
    assert confirmed["is_verified"] is True
    assert [h["to_status"] for h in confirmed["history"]] == [
        "PENDING",
        "ACCEPTED",
        "ON_THE_WAY",
        "IN_PROGRESS",
        "AWAITING_CONFIRMATION",
        "COMPLETED",
    ]
    worker.refresh_from_db()
    assert (worker.completed_jobs_count, worker.verified_jobs_count) == (1, 1)
    assert ServiceRequest.objects.get().status == "CLOSED"


@pytest.mark.parametrize(
    ("who", "action"),
    [("customer", "accept"), ("customer", "start"), ("worker", "confirm"), ("worker", "dispute")],
)
def test_wrong_party_is_refused(customer_api, worker_api, booking, act, who, action):
    client = customer_api if who == "customer" else worker_api
    if action == "confirm":
        for step in ("accept", "on-the-way", "start", "mark-complete"):
            act(worker_api, booking["id"], step)

    response = act(client, booking["id"], action, note="reason")
    assert response.status_code in (403, 409)


def test_invalid_jump_returns_409(worker_api, booking, act):
    response = act(worker_api, booking["id"], "mark-complete")

    assert response.status_code == 409
    assert response.json()["code"] == "invalid_transition"


def test_decline_reopens_request_for_another_worker(
    customer_api, worker_api, booking, act, service_request, make_worker
):
    act(worker_api, booking["id"], "decline")
    other = make_worker("01822222222", "Karim")

    assert ServiceRequest.objects.get().status == "OPEN"
    response = customer_api.post(
        "/api/v1/bookings/", {"service_request": service_request["id"], "worker": other.id}
    )
    assert response.status_code == 201


def test_only_one_active_booking_per_request(customer_api, booking, service_request, make_worker):
    other = make_worker("01822222222", "Karim")

    response = customer_api.post(
        "/api/v1/bookings/", {"service_request": service_request["id"], "worker": other.id}
    )
    assert response.status_code == 409
    assert response.json()["code"] == "request_not_open"


def test_cancel_and_dispute_need_a_reason(customer_api, booking, act):
    assert act(customer_api, booking["id"], "cancel").status_code == 400

    response = act(customer_api, booking["id"], "cancel", note="Fixed it myself")
    assert response.json()["status"] == "CANCELLED"
    assert response.json()["cancel_reason"] == "Fixed it myself"


def test_worker_cannot_start_two_jobs(
    customer_api, worker_api, booking, act, request_payload, worker
):
    second_request = customer_api.post(
        "/api/v1/service-requests/", request_payload, format="json"
    ).json()
    second = customer_api.post(
        "/api/v1/bookings/", {"service_request": second_request["id"], "worker": worker.id}
    ).json()
    for booking_id in (booking["id"], second["id"]):
        act(worker_api, booking_id, "accept")
        act(worker_api, booking_id, "on-the-way")
    act(worker_api, booking["id"], "start")

    response = act(worker_api, second["id"], "start")
    assert response.status_code == 409
    assert response.json()["code"] == "worker_busy"


def test_dispute_then_customer_cannot_confirm(customer_api, worker_api, booking, act):
    for step in ("accept", "on-the-way", "start", "mark-complete"):
        act(worker_api, booking["id"], step)

    disputed = act(customer_api, booking["id"], "dispute", note="Still leaking")
    assert disputed.json()["status"] == "DISPUTED"
    refused = act(customer_api, booking["id"], "confirm")
    assert refused.status_code == 403
    assert refused.json()["code"] == "action_not_allowed"


def test_allowed_actions_follow_status_and_role(customer_api, worker_api, booking):
    worker_view = worker_api.get(f"/api/v1/bookings/{booking['id']}/").json()
    customer_view = customer_api.get(f"/api/v1/bookings/{booking['id']}/").json()

    assert set(worker_view["allowed_actions"]) == {"accept", "decline"}
    assert customer_view["allowed_actions"] == ["cancel"]


def test_offline_worker_cannot_be_booked(customer_api, service_request, worker):
    WorkerProfile.objects.filter(pk=worker.pk).update(availability_status="OFFLINE")

    response = customer_api.post(
        "/api/v1/bookings/", {"service_request": service_request["id"], "worker": worker.id}
    )
    assert response.status_code == 400
