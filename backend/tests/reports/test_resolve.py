import pytest

from apps.audit.models import AuditLog
from apps.bookings.models import Booking
from apps.reports.models import Report
from apps.trust.services import calculate

from .conftest import URL

pytestmark = pytest.mark.django_db


def resolve(client, report_id, **data):
    return client.post(f"{URL}{report_id}/resolve/", data, format="json")


def dispute_id():
    return Report.objects.get(is_dispute=True).id


def test_admin_takes_report(report, worker, admin_api, admin_user):
    created = report("WORKER", worker.id).json()

    response = admin_api.post(f"{URL}{created['id']}/take/")

    assert response.json()["status"] == "IN_REVIEW"
    assert response.json()["assigned_admin"] == "Admin One"


def test_only_admins_resolve(report, worker, customer_api):
    created = report("WORKER", worker.id).json()

    assert resolve(customer_api, created["id"], resolution_note="x").status_code == 403


def test_disputed_booking_needs_outcome_and_fault(disputed, admin_api):
    response = resolve(admin_api, dispute_id(), resolution_note="Checked.")
    assert "booking_outcome" in response.json()["errors"]

    response = resolve(
        admin_api, dispute_id(), resolution_note="Checked.", booking_outcome="CANCELLED"
    )
    assert "fault" in response.json()["errors"]


def test_worker_fault_cancellation_counts_against_worker(
    disputed, admin_api, worker, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        response = resolve(
            admin_api,
            dispute_id(),
            resolution_note="Worker left the job unfinished.",
            booking_outcome="CANCELLED",
            fault="WORKER",
        )

    assert response.status_code == 200, response.json()
    assert response.json()["status"] == "RESOLVED"
    booking = Booking.objects.get(pk=disputed)
    assert (booking.status, booking.worker_at_fault) == ("CANCELLED", True)
    cancellation = {i["factor"]: i for i in calculate(worker)[1]}["cancellation"]
    assert cancellation["detail"]["cancelled"] == 1
    assert worker.trust_history.first().trigger == "booking_cancelled"
    assert AuditLog.objects.filter(action="report.resolved").exists()


def test_dispute_resolved_as_completed(disputed, admin_api):
    resolve(
        admin_api,
        dispute_id(),
        resolution_note="Work was fine.",
        booking_outcome="COMPLETED",
        fault="NONE",
    )

    booking = Booking.objects.get(pk=disputed)
    assert booking.status == "COMPLETED"
    assert booking.is_verified is False


def test_outcome_only_for_disputed_bookings(report, booking, admin_api):
    created = report("BOOKING", booking["id"], reason="NO_SHOW").json()

    response = resolve(
        admin_api, created["id"], resolution_note="x", booking_outcome="CANCELLED", fault="WORKER"
    )

    assert "booking_outcome" in response.json()["errors"]


@pytest.mark.parametrize("action,field", [("HIDE", "is_hidden"), ("INVALIDATE", "is_invalid")])
def test_review_moderation(report, review, worker_api, admin_api, worker, action, field):
    created = report("REVIEW", review.id, client=worker_api, reason="INAPPROPRIATE").json()

    response = resolve(admin_api, created["id"], resolution_note="Abusive.", review_action=action)

    assert response.status_code == 200
    review.refresh_from_db()
    assert getattr(review, field) is True
    assert worker.trust_history.first().trigger == "review_moderated"


def test_suspend_reported_worker(report, worker, admin_api, api_client):
    created = report("WORKER", worker.id, reason="FAKE_PROFILE").json()

    response = resolve(admin_api, created["id"], resolution_note="Fake identity.", suspend=True)

    assert response.status_code == 200
    worker.user.refresh_from_db()
    assert worker.user.is_suspended is True
    assert api_client.get(f"/api/v1/workers/{worker.id}/").status_code == 404
    assert AuditLog.objects.filter(action="user.suspended").exists()


def test_suspend_from_booking_needs_fault(report, booking, admin_api):
    created = report("BOOKING", booking["id"], reason="MISCONDUCT").json()

    response = resolve(admin_api, created["id"], resolution_note="x", suspend=True)

    assert "suspend" in response.json()["errors"]


def test_dismiss(report, worker, admin_api):
    created = report("WORKER", worker.id).json()

    blocked = resolve(
        admin_api, created["id"], status="DISMISSED", resolution_note="x", suspend=True
    )
    response = resolve(admin_api, created["id"], status="DISMISSED", resolution_note="No issue.")

    assert blocked.status_code == 400
    assert response.json()["status"] == "DISMISSED"


def test_closed_report_is_final(report, worker, admin_api):
    created = report("WORKER", worker.id).json()
    resolve(admin_api, created["id"], status="DISMISSED", resolution_note="No issue.")

    response = resolve(admin_api, created["id"], resolution_note="Again")

    assert response.status_code == 409


def test_admin_queue_filters(report, worker, disputed, admin_api):
    report("WORKER", worker.id)

    assert admin_api.get(f"{URL}?dispute=true").json()["count"] == 1
    assert admin_api.get(f"{URL}?target_type=WORKER").json()["count"] == 1
    detail = admin_api.get(f"{URL}{dispute_id()}/").json()
    assert detail["target"]["status"] == "DISPUTED"
    assert detail["target"]["history"][-1]["to_status"] == "DISPUTED"
