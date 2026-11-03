from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Report(TimeStampedModel):
    class Target(models.TextChoices):
        BOOKING = "BOOKING", "Booking"
        WORKER = "WORKER", "Worker profile"
        REVIEW = "REVIEW", "Review"

    class Reason(models.TextChoices):
        NO_SHOW = "NO_SHOW", "No-show"
        POOR_WORK = "POOR_WORK", "Poor work"
        OVERCHARGING = "OVERCHARGING", "Overcharging"
        MISCONDUCT = "MISCONDUCT", "Misconduct"
        FAKE_PROFILE = "FAKE_PROFILE", "Fake profile"
        INAPPROPRIATE = "INAPPROPRIATE", "Inappropriate content"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_REVIEW = "IN_REVIEW", "In review"
        RESOLVED = "RESOLVED", "Resolved"
        DISMISSED = "DISMISSED", "Dismissed"

    class Fault(models.TextChoices):
        WORKER = "WORKER", "Worker"
        CUSTOMER = "CUSTOMER", "Customer"
        NONE = "NONE", "No one"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_made"
    )
    target_type = models.CharField(max_length=10, choices=Target.choices)
    target_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Reason.choices)
    description = models.CharField(max_length=1000, blank=True)
    is_dispute = models.BooleanField(default=False)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_assigned",
    )
    resolution_note = models.CharField(max_length=1000, blank=True)
    fault = models.CharField(max_length=10, choices=Fault.choices, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at", "pk"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["target_type", "target_id"]),
        ]

    def __str__(self):
        return f"{self.get_reason_display()} on {self.target_type}#{self.target_id}"
