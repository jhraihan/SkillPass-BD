import pytest

FLOW = ["accept", "on-the-way", "start", "mark-complete"]


@pytest.fixture
def finish(act, customer_api, worker_api):
    def _finish(booking_id):
        for action in FLOW:
            assert act(worker_api, booking_id, action).status_code == 200
        assert act(customer_api, booking_id, "confirm").status_code == 200
        return booking_id

    return _finish


@pytest.fixture
def completed(booking, finish):
    return finish(booking["id"])


@pytest.fixture
def review_payload():
    def _payload(booking_id, **overrides):
        data = {
            "booking": booking_id,
            "quality": 5,
            "professionalism": 4,
            "punctuality": 4,
            "communication": 5,
            "would_hire_again": True,
            "comment": "Fixed the AC quickly.",
        }
        data.update(overrides)
        return data

    return _payload
