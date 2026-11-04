from datetime import timedelta

import pytest
from django.utils import timezone

from apps.bookings.models import Booking

pytestmark = pytest.mark.django_db
URL = "/api/v1/internal/process-timeouts/"


def test_timeouts_endpoint_hidden_without_token(api_client, settings):
    settings.CRON_TOKEN = ""

    assert api_client.post(URL).status_code == 404


def test_timeouts_endpoint_rejects_wrong_token(api_client, settings):
    settings.CRON_TOKEN = "s3cret-token"

    assert api_client.post(URL, HTTP_X_CRON_TOKEN="nope").status_code == 404


def test_timeouts_endpoint_expires_old_requests(api_client, settings, booking):
    settings.CRON_TOKEN = "s3cret-token"
    Booking.objects.update(created_at=timezone.now() - timedelta(days=2))

    response = api_client.post(URL, HTTP_X_CRON_TOKEN="s3cret-token")

    assert response.json() == {"expired": 1, "auto_closed": 0}
    assert Booking.objects.get().status == "EXPIRED"
