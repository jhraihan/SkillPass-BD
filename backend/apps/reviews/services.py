from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from apps.bookings.models import Booking
from apps.trust.services import recalculate

from .models import RATING_FIELDS, Review

REVIEWABLE = (Booking.Status.COMPLETED, Booking.Status.AUTO_CLOSED)


def check_eligibility(booking, customer):
    if booking.customer_id != customer.pk:
        raise PermissionDenied("You can only review your own bookings.")
    if booking.status not in REVIEWABLE:
        raise serializers.ValidationError({"booking": ["This job is not finished yet."]})
    window = timezone.timedelta(days=settings.REVIEW_WINDOW_DAYS)
    if booking.closed_at and timezone.now() - booking.closed_at > window:
        raise serializers.ValidationError({"booking": ["The time to review this job has passed."]})
    if Review.objects.filter(booking=booking).exists():
        raise serializers.ValidationError({"booking": ["You already reviewed this job."]})


@transaction.atomic
def create_review(booking, customer, **ratings):
    check_eligibility(booking, customer)
    overall = Decimal(sum(ratings[field] for field in RATING_FIELDS)) / len(RATING_FIELDS)
    try:
        review = Review.objects.create(
            booking=booking,
            customer=customer,
            worker=booking.worker,
            overall=overall.quantize(Decimal("0.01")),
            **ratings,
        )
    except IntegrityError as error:
        raise serializers.ValidationError(
            {"booking": ["You already reviewed this job."]}
        ) from error
    recalculate(booking.worker, trigger="review_created")
    return review


def short_name(full_name):
    parts = full_name.split()
    if len(parts) < 2:
        return full_name
    return f"{parts[0]} {parts[-1][0]}."
