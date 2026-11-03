from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from apps.accounts.models import User
from apps.bookings.models import Booking

pytestmark = pytest.mark.django_db


class TestPrivacy:
    def test_worker_sees_no_address_or_phone_before_accepting(self, worker_api, booking):
        body = worker_api.get(f"/api/v1/bookings/{booking['id']}/").json()

        assert body["request"]["address_detail"] is None
        assert body["customer"] == {"name": "Nusrat", "phone": None}
        assert body["contact_visible"] is False

    def test_contact_is_shared_after_accepting(self, worker_api, customer_api, booking, act):
        act(worker_api, booking["id"], "accept")

        worker_view = worker_api.get(f"/api/v1/bookings/{booking['id']}/").json()
        customer_view = customer_api.get(f"/api/v1/bookings/{booking['id']}/").json()
        assert worker_view["request"]["address_detail"] == "House 12, Road 3, Section 10"
        assert worker_view["customer"]["phone"] == "+8801712345678"
        assert customer_view["worker"]["phone"] == "+8801812345678"

    def test_outsiders_get_404(self, booking, client_for):
        stranger = User.objects.create_user(phone="01911111111", password="x", full_name="S")

        response = client_for(stranger).get(f"/api/v1/bookings/{booking['id']}/")
        assert response.status_code == 404

    def test_customer_cannot_use_another_customers_request(
        self, service_request, worker, client_for
    ):
        other = User.objects.create_user(phone="01611111111", password="x", full_name="O")

        response = client_for(other).post(
            "/api/v1/bookings/", {"service_request": service_request["id"], "worker": worker.id}
        )
        assert response.status_code == 400

    def test_workers_cannot_create_requests(self, worker_api, request_payload):
        response = worker_api.post("/api/v1/service-requests/", request_payload, format="json")
        assert response.status_code == 403


class TestLists:
    def test_scopes(self, customer_api, worker_api, booking, act):
        assert len(customer_api.get("/api/v1/bookings/?scope=active").json()["results"]) == 1
        assert customer_api.get("/api/v1/bookings/?scope=past").json()["results"] == []

        act(customer_api, booking["id"], "cancel", note="No longer needed")
        assert len(worker_api.get("/api/v1/bookings/?scope=past").json()["results"]) == 1

    def test_worker_dashboard_lists_pending_requests(self, worker_api, booking):
        body = worker_api.get("/api/v1/workers/me/dashboard/").json()

        assert [b["id"] for b in body["pending_requests"]] == [booking["id"]]
        assert body["today_jobs"] == []


class TestRequests:
    def test_past_date_is_rejected(self, customer_api, request_payload):
        request_payload["preferred_date"] = str(timezone.localdate() - timedelta(days=1))

        response = customer_api.post("/api/v1/service-requests/", request_payload, format="json")
        assert response.status_code == 400

    def test_skill_from_other_category_is_rejected(self, customer_api, request_payload):
        from apps.catalog.models import Skill

        request_payload["skills"] = [Skill.objects.get(slug="tv-repair").id]
        response = customer_api.post("/api/v1/service-requests/", request_payload, format="json")
        assert response.status_code == 400

    def test_cancelling_request_cancels_pending_booking(
        self, customer_api, booking, service_request
    ):
        response = customer_api.post(f"/api/v1/service-requests/{service_request['id']}/cancel/")

        assert response.json()["status"] == "CANCELLED"
        assert Booking.objects.get(pk=booking["id"]).status == "CANCELLED"


class TestMatching:
    def test_ranks_by_skill_trust_and_availability(
        self, customer_api, service_request, make_worker
    ):
        make_worker("01811111111", "Best", trust_score=90)
        make_worker("01822222222", "Busy", trust_score=90, availability_status="BUSY")
        make_worker("01833333333", "Category only", skills=["ac-gas-refill"], trust_score=90)
        make_worker("01844444444", "Wrong area", areas=["uttara"], trust_score=99)
        make_worker("01855555555", "Offline", trust_score=99, availability_status="OFFLINE")
        make_worker("01866666666", "Plumber", skills=["tap-pipe-repair"], trust_score=99)

        matches = customer_api.get(
            f"/api/v1/service-requests/{service_request['id']}/matches/"
        ).json()

        assert [m["display_name"] for m in matches] == ["Best", "Busy", "Category only"]
        codes = [reason["code"] for reason in matches[0]["match_reasons"]]
        assert codes == ["serves_area", "skill_match", "available_now", "high_trust"]

    def test_already_asked_worker_is_not_suggested_again(
        self, customer_api, worker_api, booking, act, service_request
    ):
        act(worker_api, booking["id"], "decline")

        matches = customer_api.get(
            f"/api/v1/service-requests/{service_request['id']}/matches/"
        ).json()
        assert matches == []


class TestTimeouts:
    def test_unanswered_booking_expires_and_unconfirmed_job_closes(
        self, worker_api, booking, act, customer_api, request_payload, worker
    ):
        Booking.objects.filter(pk=booking["id"]).update(
            created_at=timezone.now() - timedelta(hours=25)
        )
        second_request = customer_api.post(
            "/api/v1/service-requests/", request_payload, format="json"
        ).json()
        second = customer_api.post(
            "/api/v1/bookings/", {"service_request": second_request["id"], "worker": worker.id}
        ).json()
        for step in ("accept", "on-the-way", "start", "mark-complete"):
            act(worker_api, second["id"], step)
        Booking.objects.filter(pk=second["id"]).update(
            work_done_at=timezone.now() - timedelta(hours=73)
        )

        call_command("process_booking_timeouts")
        call_command("process_booking_timeouts")

        assert Booking.objects.get(pk=booking["id"]).status == "EXPIRED"
        closed = Booking.objects.get(pk=second["id"])
        assert closed.status == "AUTO_CLOSED"
        assert closed.is_verified is False
        worker.refresh_from_db()
        assert (worker.completed_jobs_count, worker.verified_jobs_count) == (1, 0)
