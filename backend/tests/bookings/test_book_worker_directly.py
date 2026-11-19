import pytest

from apps.bookings.models import Booking, ServiceRequest
from apps.catalog.models import Area

pytestmark = pytest.mark.django_db

URL = "/api/v1/service-requests/"


def test_request_with_worker_creates_booking_in_one_step(customer_api, request_payload, worker):
    response = customer_api.post(URL, {**request_payload, "worker": worker.id}, format="json")

    assert response.status_code == 201
    booking = Booking.objects.get(pk=response.json()["active_booking"])
    assert booking.worker == worker
    assert booking.status == Booking.Status.PENDING
    assert "worker" not in response.json()


def test_worker_outside_area_leaves_no_orphan_request(customer_api, request_payload, worker):
    payload = {**request_payload, "area": Area.objects.get(slug="gulshan").id, "worker": worker.id}

    response = customer_api.post(URL, payload, format="json")

    assert response.status_code == 400
    assert response.json()["errors"]["worker"] == [
        "This worker does not offer this service in this area."
    ]
    assert not ServiceRequest.objects.exists()
    assert not Booking.objects.exists()


def test_offline_worker_cannot_be_booked(customer_api, request_payload, make_worker):
    offline = make_worker("01812345670", "Offline", availability_status="OFFLINE")

    response = customer_api.post(URL, {**request_payload, "worker": offline.id}, format="json")

    assert response.status_code == 400
    assert response.json()["errors"]["worker"] == ["This worker is not taking jobs right now."]
    assert not ServiceRequest.objects.exists()


def test_unknown_worker_is_rejected(customer_api, request_payload):
    response = customer_api.post(URL, {**request_payload, "worker": 99999}, format="json")

    assert response.status_code == 400
    assert "worker" in response.json()["errors"]
    assert not ServiceRequest.objects.exists()


def test_request_without_worker_still_opens_for_matching(customer_api, request_payload):
    response = customer_api.post(URL, request_payload, format="json")

    assert response.status_code == 201
    assert response.json()["active_booking"] is None
    assert response.json()["status"] == ServiceRequest.Status.OPEN
