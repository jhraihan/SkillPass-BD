from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import CustomerProfile, User
from apps.accounts.services import MAX_FAILED_LOGINS

from .conftest import CUSTOMER_PASSWORD, WORKER_PIN

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/v1/auth/register/"
ME_URL = "/api/v1/auth/me/"
CHANGE_URL = "/api/v1/auth/password/change/"


def _register(api_client, **overrides):
    data = {
        "role": "CUSTOMER",
        "full_name": "Nusrat Jahan",
        "phone": "01712345678",
        "password": CUSTOMER_PASSWORD,
        **overrides,
    }
    return api_client.post(REGISTER_URL, data)


class TestRegister:
    def test_customer_gets_tokens_profile_and_normalized_phone(self, api_client):
        response = _register(api_client, phone="017-1234-5678")

        assert response.status_code == 201
        body = response.json()
        assert {"access", "refresh", "user"} <= body.keys()
        assert body["user"]["phone"] == "+8801712345678"
        assert body["user"]["role"] == "CUSTOMER"
        assert CustomerProfile.objects.filter(user__phone="+8801712345678").exists()

    def test_worker_registers_with_pin(self, api_client):
        response = _register(api_client, role="WORKER", password=WORKER_PIN)

        assert response.status_code == 201
        user = User.objects.get(phone="+8801712345678")
        assert user.is_worker
        assert user.check_password(WORKER_PIN)
        assert user.password != WORKER_PIN

    @pytest.mark.parametrize("pin", ["123456", "12345", "abcdef"])
    def test_worker_pin_rules(self, api_client, pin):
        response = _register(api_client, role="WORKER", password=pin)

        assert response.status_code == 400
        assert "password" in response.json()["errors"]

    def test_customer_password_must_be_strong(self, api_client):
        response = _register(api_client, password="12345678")

        assert response.status_code == 400
        assert "password" in response.json()["errors"]

    def test_duplicate_phone_is_rejected(self, api_client, customer):
        response = _register(api_client, phone="+8801712345678")

        assert response.status_code == 400
        assert "phone" in response.json()["errors"]

    def test_invalid_phone_is_rejected(self, api_client):
        response = _register(api_client, phone="12345")

        assert response.status_code == 400
        assert "phone" in response.json()["errors"]

    def test_admin_role_cannot_self_register(self, api_client):
        response = _register(api_client, role="ADMIN")

        assert response.status_code == 400
        assert "role" in response.json()["errors"]


class TestLogin:
    def test_success_returns_tokens_and_user(self, login, customer):
        response = login("01712345678", CUSTOMER_PASSWORD)

        assert response.status_code == 200
        assert response.json()["user"]["full_name"] == "Nusrat Jahan"

    def test_wrong_password_and_unknown_phone_look_the_same(self, login, customer):
        wrong = login("01712345678", "nope")
        unknown = login("01999999999", "nope")

        assert wrong.status_code == unknown.status_code == 401
        assert wrong.json()["code"] == unknown.json()["code"] == "invalid_credentials"

    def test_account_locks_after_too_many_failures(self, login, worker):
        for _ in range(MAX_FAILED_LOGINS - 1):
            assert login("01812345678", "000000").status_code == 401

        locked = login("01812345678", "000000")
        assert locked.status_code == 403
        assert locked.json()["code"] == "account_locked"

        correct_pin = login("01812345678", WORKER_PIN)
        assert correct_pin.status_code == 403

    def test_old_failures_outside_window_are_forgotten(self, login, worker):
        worker.failed_login_count = MAX_FAILED_LOGINS - 1
        worker.last_failed_login_at = timezone.now() - timedelta(days=2)
        worker.save()

        assert login("01812345678", "000000").status_code == 401
        worker.refresh_from_db()
        assert worker.failed_login_count == 1
        assert worker.locked_at is None

    def test_success_resets_failure_counter(self, login, worker):
        login("01812345678", "000000")
        login("01812345678", WORKER_PIN)

        worker.refresh_from_db()
        assert worker.failed_login_count == 0

    def test_suspended_user_cannot_login(self, login, customer):
        customer.is_suspended = True
        customer.save()

        response = login("01712345678", CUSTOMER_PASSWORD)
        assert response.status_code == 403
        assert response.json()["code"] == "account_suspended"


class TestTokens:
    def test_worker_refresh_token_lasts_30_days(self, login, worker):
        refresh = RefreshToken(login("01812345678", WORKER_PIN).json()["refresh"])

        lifetime = refresh["exp"] - refresh["iat"]
        assert lifetime == int(timedelta(days=30).total_seconds())

    def test_customer_refresh_token_lasts_7_days(self, login, customer):
        refresh = RefreshToken(login("01712345678", CUSTOMER_PASSWORD).json()["refresh"])

        assert refresh["exp"] - refresh["iat"] == int(timedelta(days=7).total_seconds())

    def test_refresh_rotates_and_keeps_worker_lifetime(self, api_client, login, worker):
        old = login("01812345678", WORKER_PIN).json()["refresh"]

        response = api_client.post("/api/v1/auth/refresh/", {"refresh": old})
        assert response.status_code == 200
        new = RefreshToken(response.json()["refresh"])
        assert new["exp"] - new["iat"] == int(timedelta(days=30).total_seconds())

        reused = api_client.post("/api/v1/auth/refresh/", {"refresh": old})
        assert reused.status_code == 401

    def test_logout_blacklists_refresh_token(self, api_client, login, customer):
        refresh = login("01712345678", CUSTOMER_PASSWORD).json()["refresh"]

        assert api_client.post("/api/v1/auth/logout/", {"refresh": refresh}).status_code == 204
        reused = api_client.post("/api/v1/auth/refresh/", {"refresh": refresh})
        assert reused.status_code == 401

    def test_suspended_user_access_token_stops_working(self, login, auth_client, customer):
        access = login("01712345678", CUSTOMER_PASSWORD).json()["access"]
        customer.is_suspended = True
        customer.save()

        assert auth_client(access).get(ME_URL).status_code == 401


class TestMe:
    def test_requires_authentication(self, api_client):
        assert api_client.get(ME_URL).status_code == 401

    def test_returns_current_user_without_secrets(self, login, auth_client, customer):
        access = login("01712345678", CUSTOMER_PASSWORD).json()["access"]

        body = auth_client(access).get(ME_URL).json()
        assert body["phone"] == "+8801712345678"
        assert "password" not in body

    def test_patch_updates_profile_but_not_role(self, login, auth_client, customer):
        client = auth_client(login("01712345678", CUSTOMER_PASSWORD).json()["access"])

        response = client.patch(
            ME_URL, {"full_name": "Nusrat J.", "preferred_language": "en", "role": "ADMIN"}
        )
        assert response.status_code == 200
        customer.refresh_from_db()
        assert customer.full_name == "Nusrat J."
        assert customer.preferred_language == "en"
        assert customer.role == "CUSTOMER"


class TestChangeCredential:
    def test_worker_changes_pin_and_old_tokens_stop_working(self, login, auth_client, worker):
        tokens = login("01812345678", WORKER_PIN).json()
        client = auth_client(tokens["access"])

        response = client.post(
            CHANGE_URL, {"current_password": WORKER_PIN, "new_password": "730264"}
        )
        assert response.status_code == 200
        worker.refresh_from_db()
        assert worker.check_password("730264")
        assert client.get(ME_URL).status_code == 401
        assert auth_client(response.json()["access"]).get(ME_URL).status_code == 200

    def test_forced_change_clears_flag(self, login, auth_client, worker):
        worker.must_change_credential = True
        worker.save()
        client = auth_client(login("01812345678", WORKER_PIN).json()["access"])

        client.post(CHANGE_URL, {"current_password": WORKER_PIN, "new_password": "730264"})
        worker.refresh_from_db()
        assert worker.must_change_credential is False

    def test_wrong_current_pin_is_rejected(self, login, auth_client, worker):
        client = auth_client(login("01812345678", WORKER_PIN).json()["access"])

        response = client.post(CHANGE_URL, {"current_password": "000000", "new_password": "730264"})
        assert response.status_code == 400
        assert "current_password" in response.json()["errors"]

    def test_weak_new_pin_is_rejected(self, login, auth_client, worker):
        client = auth_client(login("01812345678", WORKER_PIN).json()["access"])

        response = client.post(
            CHANGE_URL, {"current_password": WORKER_PIN, "new_password": "111111"}
        )
        assert response.status_code == 400
        assert "new_password" in response.json()["errors"]
