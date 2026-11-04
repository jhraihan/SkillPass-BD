import pytest
from django.core.management import CommandError, call_command

from apps.accounts.models import User
from apps.bookings.models import Booking
from apps.reports.models import Report
from apps.reviews.models import Review
from apps.verification.models import Verification

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def private_root(settings, tmp_path):
    settings.PRIVATE_MEDIA_ROOT = tmp_path / "private"


def test_refuses_without_confirmation_when_debug_is_off():
    with pytest.raises(CommandError):
        call_command("seed_demo")


def test_seeds_a_complete_demo(capsys, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        call_command("seed_demo", "--yes")

    assert User.objects.filter(role="WORKER").count() == 6
    assert User.objects.filter(role="CUSTOMER").count() == 3
    statuses = sorted(Booking.objects.values_list("status", flat=True))
    assert statuses.count("COMPLETED") == 4
    assert {"IN_PROGRESS", "PENDING", "DISPUTED"} <= set(statuses)
    assert Review.objects.count() == 4
    assert Verification.objects.filter(status="APPROVED").count() == 1
    assert Verification.objects.filter(status="PENDING").count() == 1
    assert Report.objects.filter(is_dispute=True, status="OPEN").count() == 1
    rahim = User.objects.get(phone="+8801800000001").worker_profile
    assert rahim.identity_verified and rahim.trust_score > 0
    assert "PIN 482915" in capsys.readouterr().out


def test_running_twice_is_safe():
    call_command("seed_demo", "--yes")
    call_command("seed_demo", "--yes")

    assert User.objects.filter(role="ADMIN").count() == 1
