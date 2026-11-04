from datetime import timedelta

import pytest
from django.utils import timezone

from apps.bookings.models import Booking
from apps.reports.models import Report

pytestmark = pytest.mark.django_db
URL = "/api/v1/admin/stats/"
FLOW = ["accept", "on-the-way", "start", "mark-complete"]


@pytest.fixture
def busy_day(make_worker, customer, customer_api, request_payload, act, client_for):
    worker = make_worker("01812345670", "Rahim Uddin", identity_verified=True)
    worker_api = client_for(worker.user)
    make_worker("01812345671", "Karim", availability_status="OFFLINE")
    ids = []
    for _ in range(3):
        created = customer_api.post("/api/v1/service-requests/", request_payload, format="json")
        booking = customer_api.post(
            "/api/v1/bookings/", {"service_request": created.json()["id"], "worker": worker.id}
        )
        ids.append(booking.json()["id"])
    for action in FLOW:
        act(worker_api, ids[0], action)
    act(customer_api, ids[0], "confirm")
    act(worker_api, ids[1], "accept")
    act(customer_api, ids[1], "cancel", note="Changed plans.")
    Report.objects.create(
        reporter=customer, target_type="WORKER", target_id=worker.id, reason="OTHER"
    )
    return ids


def test_only_admins(customer_api):
    assert customer_api.get(URL).status_code == 403


def test_dashboard_numbers(admin_api, busy_day):
    body = admin_api.get(URL).json()

    assert body["period_days"] == 30
    assert body["users"]["by_role"] == {
        "CUSTOMER": 1,
        "WORKER": 2,
        "CONTRACTOR": 0,
        "ADMIN": 1,
    }
    assert body["workers"] == {
        "total": 2,
        "active": 2,
        "available_now": 1,
        "identity_verified": 1,
    }
    bookings = body["bookings"]
    assert bookings["total"] == 3
    assert bookings["by_status"]["COMPLETED"] == 1
    assert bookings["by_status"]["CANCELLED"] == 1
    assert bookings["by_status"]["PENDING"] == 1
    assert bookings["completion_rate"] == 0.5
    assert bookings["verified_jobs"] == 1
    assert body["queues"] == {"pending_verifications": 0, "open_reports": 1, "open_disputes": 0}
    assert body["top_categories"][0]["slug"] == "ac-repair"
    assert body["top_categories"][0]["bookings"] == 3


def test_daily_series_covers_every_day(admin_api, busy_day):
    daily = admin_api.get(f"{URL}?days=7").json()["bookings"]["daily"]

    assert len(daily) == 7
    assert daily[-1]["date"] == timezone.localdate().isoformat()
    assert daily[-1] == {"date": daily[-1]["date"], "requested": 3, "completed": 1}
    assert sum(day["requested"] for day in daily) == 3


def test_old_bookings_fall_outside_the_period(admin_api, busy_day):
    Booking.objects.update(created_at=timezone.now() - timedelta(days=40))

    assert admin_api.get(URL).json()["bookings"]["total"] == 0
    assert admin_api.get(f"{URL}?days=90").json()["bookings"]["total"] == 3


def test_unknown_period_falls_back_to_30(admin_api):
    assert admin_api.get(f"{URL}?days=5").json()["period_days"] == 30
    assert admin_api.get(f"{URL}?days=abc").json()["period_days"] == 30
