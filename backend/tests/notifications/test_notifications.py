import pytest

from apps.notifications.messages import render
from apps.notifications.models import Notification
from apps.notifications.services import notify

pytestmark = pytest.mark.django_db
URL = "/api/v1/notifications/"
FLOW = ["accept", "on-the-way", "start", "mark-complete"]


def types_for(user):
    return list(Notification.objects.filter(recipient=user).values_list("type", flat=True))


@pytest.fixture
def booked(customer_api, service_request, worker, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        response = customer_api.post(
            "/api/v1/bookings/", {"service_request": service_request["id"], "worker": worker.id}
        )
    return response.json()["id"]


@pytest.fixture
def run(act, django_capture_on_commit_callbacks):
    def _run(client, booking_id, action, note=None):
        with django_capture_on_commit_callbacks(execute=True):
            response = act(client, booking_id, action, note=note)
        assert response.status_code == 200, response.json()
        return response

    return _run


def test_new_booking_notifies_worker_in_bengali(booked, worker):
    item = Notification.objects.get(recipient=worker.user)

    assert item.type == "NEW_JOB"
    assert item.title == "নতুন কাজ: এসি মেরামত, মিরপুর"
    assert item.data["booking_id"] == booked
    assert item.data["category"]["name_en"] == "AC Repair"


def test_full_job_flow_notifications(booked, run, customer_api, worker_api, customer, worker):
    for action in FLOW:
        run(worker_api, booked, action)
    run(customer_api, booked, "confirm")

    assert types_for(customer) == [
        "CONFIRM_COMPLETION",
        "JOB_STARTED",
        "WORKER_ON_THE_WAY",
        "BOOKING_ACCEPTED",
    ]
    assert types_for(worker.user) == ["JOB_COMPLETED", "NEW_JOB"]


def test_cancel_notifies_only_the_other_side(booked, run, customer_api, customer, worker):
    run(customer_api, booked, "cancel", note="Not needed any more.")

    assert "BOOKING_CANCELLED" not in types_for(customer)
    cancelled = Notification.objects.get(recipient=worker.user, type="BOOKING_CANCELLED")
    assert cancelled.data["reason"] == "Not needed any more."


def test_dispute_notifies_worker_and_admins(
    booked, run, customer_api, worker_api, worker, admin_user
):
    for action in FLOW:
        run(worker_api, booked, action)
    run(customer_api, booked, "dispute", note="Still broken.")

    assert "BOOKING_DISPUTED" in types_for(worker.user)
    assert types_for(admin_user) == ["BOOKING_DISPUTED"]


def test_dispute_resolution_notifies_both(
    booked, run, customer_api, worker_api, admin_api, customer, worker
):
    for action in FLOW:
        run(worker_api, booked, action)
    run(customer_api, booked, "dispute", note="Still broken.")
    report_id = admin_api.get("/api/v1/reports/?dispute=true").json()["results"][0]["id"]

    dismissed = admin_api.post(
        f"/api/v1/reports/{report_id}/resolve/",
        {"status": "DISMISSED", "resolution_note": "Nothing to do."},
        format="json",
    )
    response = admin_api.post(
        f"/api/v1/reports/{report_id}/resolve/",
        {"resolution_note": "Fixed by agreement.", "booking_outcome": "COMPLETED", "fault": "NONE"},
        format="json",
    )

    assert dismissed.status_code == 400
    assert response.status_code == 200
    for person in (customer, worker.user):
        item = Notification.objects.get(recipient=person, type="DISPUTE_RESOLVED")
        assert item.data["outcome"] == "COMPLETED"


def test_review_and_verification_notify_worker(worker):
    notify(worker.user, Notification.Type.REVIEW_RECEIVED, {"stars": "4.5", "category": "AC"})

    assert Notification.objects.get().title == "নতুন রিভিউ: 4.5 তারা"


def test_render_uses_language_and_ignores_missing_params():
    data = {"category": {"name_en": "Plumbing", "name_bn": "প্লাম্বিং"}}

    assert render("NEW_JOB", "en", data)[0] == "New job: Plumbing, "
    assert render("BOOKING_CANCELLED", "bn", data) == ("কাজ বাতিল হয়েছে: প্লাম্বিং", "")


def test_list_count_and_mark_read(booked, worker_api, customer_api):
    assert worker_api.get(f"{URL}unread-count/").json() == {"count": 1}
    item = worker_api.get(f"{URL}?unread=true").json()["results"][0]

    assert customer_api.post(f"{URL}{item['id']}/read/").json() == {"updated": 0}
    assert worker_api.post(f"{URL}{item['id']}/read/").json() == {"updated": 1}
    assert worker_api.get(f"{URL}unread-count/").json() == {"count": 0}
    assert worker_api.get(f"{URL}?unread=true").json()["count"] == 0


def test_read_all(booked, run, worker_api, customer_api, customer):
    run(worker_api, booked, "accept")
    run(worker_api, booked, "on-the-way")

    assert customer_api.post(f"{URL}read-all/").json() == {"updated": 2}
    assert customer_api.get(f"{URL}unread-count/").json() == {"count": 0}


def test_notifications_need_login(api_client):
    assert api_client.get(URL).status_code == 401


def test_support_contacts_are_public(api_client, settings):
    settings.SUPPORT_PHONE = "+8801711111111"

    body = api_client.get("/api/v1/support/").json()

    assert body["phone"] == "+8801711111111"
    assert set(body) == {"phone", "whatsapp", "hours"}
