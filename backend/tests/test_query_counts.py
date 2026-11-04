import pytest
from django.core.management import call_command
from django.db import connection
from django.test.utils import CaptureQueriesContext
from django.utils import timezone

from apps.accounts.models import User
from apps.bookings.models import Booking, ServiceRequest
from apps.catalog.models import Area, ServiceCategory
from apps.notifications.models import Notification
from apps.reports.models import Report
from apps.reviews.models import Review
from apps.trust.models import TrustScoreHistory
from apps.verification.models import Verification

pytestmark = pytest.mark.django_db


def make_completed_booking(worker, customer):
    request = ServiceRequest.objects.create(
        customer=customer,
        category=ServiceCategory.objects.get(slug="ac-repair"),
        area=Area.objects.get(slug="mirpur"),
        description="Fix the AC.",
        address_detail="House 1",
        preferred_date=timezone.localdate(),
        preferred_slot="MORNING",
        status="CLOSED",
    )
    return Booking.objects.create(
        service_request=request,
        customer=customer,
        worker=worker,
        status="COMPLETED",
        accepted_at=timezone.now(),
        closed_at=timezone.now(),
        is_verified=True,
    )


def queries(client, url):
    with CaptureQueriesContext(connection) as context:
        response = client.get(url)
    assert response.status_code == 200, response.content
    return len(context)


@pytest.fixture
def grow(make_worker, customer, customer_api, request_payload):
    created = {"workers": [], "bookings": []}

    def _grow(count):
        start = len(created["workers"])
        for index in range(start, start + count):
            worker = make_worker(f"0181000{index:04d}", f"Worker {index}", identity_verified=True)
            created["workers"].append(worker)
            request = customer_api.post(
                "/api/v1/service-requests/", request_payload, format="json"
            ).json()
            booking = customer_api.post(
                "/api/v1/bookings/", {"service_request": request["id"], "worker": worker.id}
            ).json()
            created["bookings"].append(booking["id"])
            Notification.objects.create(recipient=customer, type="BOOKING_ACCEPTED", title="x")
            Report.objects.create(
                reporter=customer, target_type="WORKER", target_id=worker.id, reason="OTHER"
            )
            Verification.objects.create(worker=worker, type="IDENTITY")
            User.objects.create_user(phone=f"0171000{index:04d}", password="x", full_name="C")
        return created

    return _grow


@pytest.mark.parametrize(
    "url,client_name",
    [
        ("/api/v1/workers/?area=mirpur", "api_client"),
        ("/api/v1/bookings/", "customer_api"),
        ("/api/v1/notifications/", "customer_api"),
        ("/api/v1/verification/", "admin_api"),
        ("/api/v1/admin/users/", "admin_api"),
    ],
)
def test_list_endpoints_do_not_grow_with_rows(request, grow, url, client_name):
    client = request.getfixturevalue(client_name)
    grow(2)
    small = queries(client, url)
    grow(4)
    large = queries(client, url)

    assert large == small, f"{url}: {small} queries for 2 rows, {large} for 6"


def test_worker_reviews_and_history_do_not_grow(api_client, make_worker, customer):
    worker = make_worker("01812345670", "Rahim")
    url_reviews = f"/api/v1/workers/{worker.id}/reviews/"
    url_history = f"/api/v1/workers/{worker.id}/work-history/"
    counts = []
    for size in (2, 6):
        while Review.objects.count() < size:
            booking = make_completed_booking(worker, customer)
            Review.objects.create(
                booking=booking,
                customer=customer,
                worker=worker,
                quality=5,
                professionalism=5,
                punctuality=5,
                communication=5,
                overall=5,
                would_hire_again=True,
            )
        counts.append((queries(api_client, url_reviews), queries(api_client, url_history)))

    assert counts[0] == counts[1]


def test_admin_report_queue_query_budget(admin_api, grow):
    grow(6)

    assert queries(admin_api, "/api/v1/reports/") <= 40


def test_recalculate_command(make_worker, capsys):
    make_worker("01812345670", "Rahim")

    call_command("recalculate_trust_scores")

    assert "1 worker" in capsys.readouterr().out
    assert TrustScoreHistory.objects.count() == 1
