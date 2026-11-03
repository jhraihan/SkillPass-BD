from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.bookings.models import Booking
from apps.workers.models import WorkerProfile
from common.models import TimeStampedModel

RATING_FIELDS = ("quality", "professionalism", "punctuality", "communication")


def _rating_range(field):
    return models.CheckConstraint(
        condition=Q(**{f"{field}__gte": 1, f"{field}__lte": 5}), name=f"review_{field}_1_to_5"
    )


class Review(TimeStampedModel):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews_written"
    )
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name="reviews")
    quality = models.PositiveSmallIntegerField()
    professionalism = models.PositiveSmallIntegerField()
    punctuality = models.PositiveSmallIntegerField()
    communication = models.PositiveSmallIntegerField()
    overall = models.DecimalField(max_digits=3, decimal_places=2)
    would_hire_again = models.BooleanField()
    comment = models.TextField(max_length=1000, blank=True)
    is_hidden = models.BooleanField(default=False)
    is_invalid = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        constraints = [_rating_range(field) for field in RATING_FIELDS]

    def __str__(self):
        return f"Review of booking #{self.booking_id}: {self.overall}"
