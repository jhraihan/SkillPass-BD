from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_JOB = "NEW_JOB", "New job request"
        BOOKING_ACCEPTED = "BOOKING_ACCEPTED", "Booking accepted"
        BOOKING_DECLINED = "BOOKING_DECLINED", "Booking declined"
        BOOKING_EXPIRED = "BOOKING_EXPIRED", "Booking expired"
        BOOKING_CANCELLED = "BOOKING_CANCELLED", "Booking cancelled"
        WORKER_ON_THE_WAY = "WORKER_ON_THE_WAY", "Worker on the way"
        JOB_STARTED = "JOB_STARTED", "Job started"
        CONFIRM_COMPLETION = "CONFIRM_COMPLETION", "Confirm completion"
        JOB_COMPLETED = "JOB_COMPLETED", "Job completed"
        JOB_AUTO_CLOSED = "JOB_AUTO_CLOSED", "Job closed automatically"
        BOOKING_DISPUTED = "BOOKING_DISPUTED", "Booking disputed"
        DISPUTE_RESOLVED = "DISPUTE_RESOLVED", "Dispute resolved"
        REVIEW_RECEIVED = "REVIEW_RECEIVED", "Review received"
        VERIFICATION_APPROVED = "VERIFICATION_APPROVED", "Verification approved"
        VERIFICATION_REJECTED = "VERIFICATION_REJECTED", "Verification rejected"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=150)
    body = models.CharField(max_length=300, blank=True)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [models.Index(fields=["recipient", "is_read", "created_at"])]

    def __str__(self):
        return f"{self.type} for {self.recipient_id}"
