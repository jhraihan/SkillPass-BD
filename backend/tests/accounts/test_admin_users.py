import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.credentials import is_weak_pin
from apps.accounts.tokens import issue_tokens
from apps.audit.models import AuditLog

pytestmark = pytest.mark.django_db
URL = "/api/v1/admin/users/"


def signed_in(user):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {issue_tokens(user)['access']}")
    return client


def test_list_and_filters(admin_api, customer, make_worker):
    make_worker("01812345670", "Rahim Uddin")

    assert admin_api.get(URL).json()["count"] == 3
    assert admin_api.get(f"{URL}?role=WORKER").json()["results"][0]["worker_profile_id"]
    assert admin_api.get(f"{URL}?search=Nusrat").json()["count"] == 1
    assert admin_api.get(f"{URL}?state=suspended").json()["count"] == 0


def test_only_admins(customer_api):
    assert customer_api.get(URL).status_code == 403


def test_suspend_needs_reason_and_signs_user_out(admin_api, customer):
    client = signed_in(customer)
    assert client.get("/api/v1/auth/me/").status_code == 200

    assert admin_api.post(f"{URL}{customer.id}/suspend/", {}).status_code == 400
    response = admin_api.post(f"{URL}{customer.id}/suspend/", {"reason": "Abuse"})

    assert response.json()["is_suspended"] is True
    assert client.get("/api/v1/auth/me/").status_code == 401
    entry = AuditLog.objects.get(action="user.suspended")
    assert entry.metadata == {"reason": "Abuse"}


def test_reactivate(admin_api, customer):
    admin_api.post(f"{URL}{customer.id}/suspend/", {"reason": "Abuse"})

    response = admin_api.post(f"{URL}{customer.id}/reactivate/")

    assert response.json()["is_suspended"] is False
    assert signed_in(customer).get("/api/v1/auth/me/").status_code == 200


def test_unlock(admin_api, customer):
    customer.locked_at = timezone.now()
    customer.failed_login_count = 10
    customer.save()

    response = admin_api.post(f"{URL}{customer.id}/unlock/")

    assert (response.json()["is_locked"], response.json()["failed_login_count"]) == (False, 0)


def test_reset_worker_pin(admin_api, make_worker):
    worker = make_worker("01812345670", "Rahim Uddin")
    response = admin_api.post(f"{URL}{worker.user.id}/reset-credential/")

    body = response.json()
    pin = body["temporary_credential"]
    assert body["kind"] == "pin"
    assert len(pin) == 6 and pin.isdigit() and not is_weak_pin(pin, worker.user.phone)
    assert response["Cache-Control"] == "no-store"
    worker.user.refresh_from_db()
    assert worker.user.check_password(pin)
    assert worker.user.must_change_credential is True
    entry = AuditLog.objects.get(action="user.credential_reset")
    assert pin not in str(entry.metadata)


def test_reset_customer_password(admin_api, customer):
    body = admin_api.post(f"{URL}{customer.id}/reset-credential/").json()

    assert body["kind"] == "password"
    assert len(body["temporary_credential"]) == 12


def test_admin_cannot_act_on_self(admin_api, admin_user):
    assert admin_api.post(f"{URL}{admin_user.id}/suspend/", {"reason": "x"}).status_code == 400
    assert admin_api.post(f"{URL}{admin_user.id}/reset-credential/").status_code == 400
