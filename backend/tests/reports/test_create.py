import pytest

from apps.reports.models import Report

from .conftest import URL

pytestmark = pytest.mark.django_db


def test_customer_reports_worker_profile(report, worker):
    response = report("WORKER", worker.id, reason="FAKE_PROFILE", description="Photo is fake.")

    assert response.status_code == 201, response.json()
    assert response.json()["status"] == "OPEN"
    assert Report.objects.get().reporter.full_name == "Nusrat Jahan"


def test_duplicate_open_report_conflicts(report, worker):
    report("WORKER", worker.id)
    response = report("WORKER", worker.id)

    assert response.status_code == 409
    assert response.json()["code"] == "already_reported"


def test_cannot_report_yourself(report, worker, worker_api):
    assert report("WORKER", worker.id, client=worker_api).status_code == 400


def test_unknown_target(report):
    assert report("WORKER", 999999).status_code == 404


def test_only_participants_report_bookings(report, booking, make_worker, client_for):
    outsider = client_for(make_worker("01855555555", "Outsider").user)

    assert report("BOOKING", booking["id"], client=outsider).status_code == 404
    assert report("BOOKING", booking["id"], reason="NO_SHOW").status_code == 201


def test_review_reports(report, review, worker_api):
    assert report("REVIEW", review.id).status_code == 400
    assert report("REVIEW", review.id, client=worker_api, reason="INAPPROPRIATE").status_code == 201


def test_users_see_only_their_reports(report, worker, worker_api, customer_api, admin_api):
    report("WORKER", worker.id)

    assert customer_api.get(URL).json()["count"] == 1
    assert worker_api.get(URL).json()["count"] == 0
    assert "reporter" not in customer_api.get(URL).json()["results"][0]
    assert admin_api.get(URL).json()["results"][0]["reporter"]["name"] == "Nusrat Jahan"


def test_guests_cannot_report(api_client, worker):
    response = api_client.post(
        URL, {"target_type": "WORKER", "target_id": worker.id, "reason": "OTHER"}
    )

    assert response.status_code == 401


def test_dispute_opens_a_report(disputed):
    entry = Report.objects.get()

    assert (entry.target_type, entry.target_id, entry.is_dispute) == ("BOOKING", disputed, True)
    assert entry.reason == "POOR_WORK"
    assert entry.description == "The AC still leaks."
