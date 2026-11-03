import uuid

from django.conf import settings
from django.db import models

from apps.workers.models import WorkerProfile, WorkerSkill
from common.models import TimeStampedModel
from common.storage import private_storage


def document_path(document, filename):
    extension = filename.rsplit(".", 1)[-1].lower()
    return f"verification/{document.verification.worker_id}/{uuid.uuid4().hex}.{extension}"


class Verification(TimeStampedModel):
    class Type(models.TextChoices):
        IDENTITY = "IDENTITY", "Identity"
        SKILL_EVIDENCE = "SKILL_EVIDENCE", "Skill evidence"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    worker = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="verifications"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    worker_skill = models.ForeignKey(
        WorkerSkill,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verifications",
    )
    skill_name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verification_decisions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["created_at", "pk"]
        indexes = [models.Index(fields=["status", "created_at"])]

    def __str__(self):
        return f"{self.get_type_display()} for {self.worker} ({self.status})"


class VerificationDocument(models.Model):
    verification = models.ForeignKey(
        Verification, on_delete=models.CASCADE, related_name="documents"
    )
    file = models.FileField(upload_to=document_path, storage=private_storage)
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=50)
    size = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["pk"]

    def __str__(self):
        return self.original_name
