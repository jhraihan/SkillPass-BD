from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.catalog.models import Area, ServiceCategory, Skill
from apps.workers.services import create_worker_profile, set_service_areas, set_skills


@pytest.fixture
def api_client():
    return APIClient()


def _client(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def customer(db):
    return User.objects.create_user(phone="01712345678", password="x", full_name="Nusrat Jahan")


@pytest.fixture
def make_worker(db):
    def _make(phone, name, skills=("ac-servicing",), areas=("mirpur",), **fields):
        user = User.objects.create_user(
            phone=phone, password="482915", full_name=name, role=User.Role.WORKER
        )
        profile = create_worker_profile(user)
        set_skills(profile, Skill.objects.filter(slug__in=skills).values_list("id", flat=True))
        set_service_areas(profile, Area.objects.filter(slug__in=areas).values_list("id", flat=True))
        fields.setdefault("availability_status", "AVAILABLE")
        for key, value in fields.items():
            setattr(profile, key, value)
        profile.save()
        return profile

    return _make


@pytest.fixture
def worker(make_worker):
    return make_worker("01812345678", "Rahim Uddin")


@pytest.fixture
def customer_api(customer):
    return _client(customer)


@pytest.fixture
def worker_api(worker):
    return _client(worker.user)


@pytest.fixture
def client_for():
    return _client


@pytest.fixture
def request_payload():
    return {
        "category": ServiceCategory.objects.get(slug="ac-repair").id,
        "skills": [Skill.objects.get(slug="ac-servicing").id],
        "description": "AC is not cooling and water is leaking.",
        "area": Area.objects.get(slug="mirpur").id,
        "address_detail": "House 12, Road 3, Section 10",
        "preferred_date": str(timezone.localdate() + timedelta(days=1)),
        "preferred_slot": "MORNING",
    }


@pytest.fixture
def service_request(customer_api, request_payload):
    response = customer_api.post("/api/v1/service-requests/", request_payload, format="json")
    assert response.status_code == 201, response.json()
    return response.json()


@pytest.fixture
def booking(customer_api, service_request, worker):
    response = customer_api.post(
        "/api/v1/bookings/", {"service_request": service_request["id"], "worker": worker.id}
    )
    assert response.status_code == 201, response.json()
    return response.json()


@pytest.fixture
def act():
    def _act(client, booking_id, action, note=None):
        data = {"note": note} if note else {}
        return client.post(f"/api/v1/bookings/{booking_id}/{action}/", data)

    return _act
