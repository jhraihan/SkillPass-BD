import pytest

from apps.accounts.models import User

CUSTOMER_PASSWORD = "Strong-pass-2026"
WORKER_PIN = "482915"


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        phone="01712345678", password=CUSTOMER_PASSWORD, full_name="Nusrat Jahan"
    )


@pytest.fixture
def worker(db):
    return User.objects.create_user(
        phone="01812345678", password=WORKER_PIN, full_name="Rahim Uddin", role=User.Role.WORKER
    )


@pytest.fixture
def login(api_client):
    def _login(phone, password):
        return api_client.post("/api/v1/auth/login/", {"phone": phone, "password": password})

    return _login


@pytest.fixture
def auth_client(api_client):
    def _auth(access):
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        return api_client

    return _auth
