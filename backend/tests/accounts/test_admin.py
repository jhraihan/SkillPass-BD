import pytest

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_client(client):
    admin = User.objects.create_superuser(
        phone="01912345678", password="Admin-pass-2026", full_name="Karim"
    )
    client.force_login(admin)
    return client


@pytest.mark.parametrize(
    "url",
    ["/admin/accounts/user/", "/admin/accounts/user/add/", "/admin/accounts/customerprofile/"],
)
def test_admin_pages_load(admin_client, url):
    assert admin_client.get(url).status_code == 200


def test_admin_can_create_user_with_local_phone(admin_client):
    response = admin_client.post(
        "/admin/accounts/user/add/",
        {
            "phone": "01512345678",
            "full_name": "Salma",
            "role": "CUSTOMER",
            "password1": "Strong-pass-2026",
            "password2": "Strong-pass-2026",
        },
    )

    assert response.status_code == 302
    assert User.objects.filter(phone="+8801512345678").exists()


def test_unlock_action_clears_lock(admin_client):
    locked = User.objects.create_user(phone="01612345678", password="x", full_name="Locked")
    User.objects.filter(pk=locked.pk).update(failed_login_count=10, locked_at="2026-01-01T00:00Z")

    admin_client.post(
        "/admin/accounts/user/",
        {"action": "unlock_selected", "_selected_action": [locked.pk]},
    )

    locked.refresh_from_db()
    assert locked.locked_at is None
    assert locked.failed_login_count == 0
