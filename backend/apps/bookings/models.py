from django.conf import settings
from django.db import models
from django.db.models import Q

from apps.catalog.models import Area, ServiceCategory, Skill
from apps.workers.models import WorkerProfile
from common.models import TimeStampedModel


class ServiceRequest(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        BOOKED = "BOOKED", "Booked"
        CLOSED = "CLOSED", "Closed"
        CANCELLED = "CANCELLED", "Cancelled"

    class TimeSlot(models.TextChoices):
        MORNING = "MORNING", "Morning"
        AFTERNOON = "AFTERNOON", "Afternoon"
        EVENING = "EVENING", "Evening"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="service_requests"
    )
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name="+")
    skills = models.ManyToManyField(Skill, blank=True, related_name="+")
    description = models.TextField(max_length=1000)
    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name="+")
    address_detail = models.CharField(max_length=255)
    preferred_date = models.DateField()
    preferred_slot = models.CharField(max_length=10, choices=TimeSlot.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Request #{self.pk} ({self.category})"


class Booking(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        DECLINED = "DECLINED", "Declined"
        EXPIRED = "EXPIRED", "Expired"
        ON_THE_WAY = "ON_THE_WAY", "On the way"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION", "Awaiting confirmation"
        COMPLETED = "COMPLETED", "Completed"
        AUTO_CLOSED = "AUTO_CLOSED", "Auto closed"
        CANCELLED = "CANCELLED", "Cancelled"
        DISPUTED = "DISPUTED", "Disputed"

    ACTIVE_STATUSES = (
        Status.PENDING,
        Status.ACCEPTED,
        Status.ON_THE_WAY,
        Status.IN_PROGRESS,
        Status.AWAITING_CONFIRMATION,
        Status.DISPUTED,
    )
    CONTACT_STATUSES = (
        Status.ACCEPTED,
        Status.ON_THE_WAY,
        Status.IN_PROGRESS,
        Status.AWAITING_CONFIRMATION,
        Status.COMPLETED,
        Status.AUTO_CLOSED,
        Status.DISPUTED,
    )

    service_request = models.ForeignKey(
        ServiceRequest, on_delete=models.CASCADE, related_name="bookings"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="customer_bookings"
    )
    worker = models.ForeignKey(WorkerProfile, on_delete=models.PROTECT, related_name="bookings")
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.PENDING, db_index=True
    )
    accepted_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    work_done_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="+",
    )
    cancel_reason = models.TextField(blank=True)
    dispute_reason = models.TextField(blank=True)
    completion_notes = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    worker_at_fault = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["service_request"],
                condition=Q(
                    status__in=[
                        "PENDING",
                        "ACCEPTED",
                        "ON_THE_WAY",
                        "IN_PROGRESS",
                        "AWAITING_CONFIRMATION",
                        "DISPUTED",
                    ]
                ),
                name="one_active_booking_per_request",
            ),
            models.UniqueConstraint(
                fields=["worker"],
                condition=Q(status="IN_PROGRESS"),
                name="one_job_in_progress_per_worker",
            ),
        ]

    def __str__(self):
        return f"Booking #{self.pk} ({self.status})"

    @property
    def contact_visible(self):
        return self.accepted_at is not None and self.status in self.CONTACT_STATUSES


class BookingStatusHistory(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="history")
    from_status = models.CharField(max_length=25, blank=True)
    to_status = models.CharField(max_length=25)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="+"
    )
    actor_role = models.CharField(max_length=10)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at", "pk"]
        verbose_name_plural = "booking status history"

    def __str__(self):
        return f"#{self.booking_id}: {self.from_status} -> {self.to_status}"
