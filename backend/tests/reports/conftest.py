import pytest

from apps.reviews.models import Review

URL = "/api/v1/reports/"


@pytest.fixture
def report(customer_api):
    def _report(target_type, target_id, client=None, reason="MISCONDUCT", **extra):
        data = {"target_type": target_type, "target_id": target_id, "reason": reason, **extra}
        return (client or customer_api).post(URL, data, format="json")

    return _report


@pytest.fixture
def disputed(booking, act, customer_api, worker_api, django_capture_on_commit_callbacks):
    for action in ["accept", "on-the-way", "start", "mark-complete"]:
        assert act(worker_api, booking["id"], action).status_code == 200
    with django_capture_on_commit_callbacks(execute=True):
        response = act(customer_api, booking["id"], "dispute", note="The AC still leaks.")
    assert response.status_code == 200
    return booking["id"]


@pytest.fixture
def review(booking, act, customer_api, worker_api, customer, worker):
    for action in ["accept", "on-the-way", "start", "mark-complete"]:
        act(worker_api, booking["id"], action)
    act(customer_api, booking["id"], "confirm")
    return Review.objects.create(
        booking_id=booking["id"],
        customer=customer,
        worker=worker,
        quality=1,
        professionalism=1,
        punctuality=1,
        communication=1,
        overall=1,
        would_hire_again=False,
        comment="Rude words here.",
    )
