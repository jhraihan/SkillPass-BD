import pytest

from apps.accounts.models import User

pytestmark = pytest.mark.django_db


def test_create_user_normalizes_phone_and_hashes_password():
    user = User.objects.create_user(phone="01712345678", password="482915", full_name="Rahim")

    assert user.phone == "+8801712345678"
    assert user.role == User.Role.CUSTOMER
    assert user.preferred_language == "bn"
    assert user.check_password("482915")
    assert user.password != "482915"


def test_create_superuser_is_admin():
    admin = User.objects.create_superuser(
        phone="01812345678", password="strong-pass-123", full_name="Karim"
    )

    assert admin.role == User.Role.ADMIN
    assert admin.is_staff and admin.is_superuser


def test_empty_email_is_stored_as_null():
    first = User.objects.create_user(phone="01912345678", password="x", full_name="A", email="")
    second = User.objects.create_user(phone="01512345678", password="x", full_name="B", email="")

    assert first.email is None and second.email is None
