from django.conf import settings
from django.db import models

from apps.catalog.models import Area, Skill
from common.models import TimeStampedModel

NEW_WORKER_JOB_THRESHOLD = 3


class WorkerProfile(TimeStampedModel):
    class Availability(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        BUSY = "BUSY", "Busy"
        OFFLINE = "OFFLINE", "Offline"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="worker_profile"
    )
    display_name = models.CharField(max_length=100)
    photo = models.ImageField(upload_to="workers/photos/", blank=True)
    bio = models.TextField(max_length=1000, blank=True)
    years_experience = models.PositiveSmallIntegerField(default=0)
    availability_status = models.CharField(
        max_length=10, choices=Availability.choices, default=Availability.OFFLINE
    )
    skills = models.ManyToManyField(Skill, through="WorkerSkill", related_name="workers")
    service_areas = models.ManyToManyField(
        Area, through="WorkerServiceArea", related_name="workers"
    )

    identity_verified = models.BooleanField(default=False)
    trust_score = models.PositiveSmallIntegerField(default=0)
    completed_jobs_count = models.PositiveIntegerField(default=0)
    verified_jobs_count = models.PositiveIntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    last_active_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-trust_score", "-verified_jobs_count", "display_name"]
        indexes = [
            models.Index(
                fields=["-trust_score", "-verified_jobs_count", "display_name"],
                name="worker_ranking_idx",
            ),
            models.Index(fields=["availability_status"]),
        ]

    def __str__(self):
        return self.display_name

    @property
    def is_new(self):
        return self.completed_jobs_count < NEW_WORKER_JOB_THRESHOLD


class WorkerSkill(models.Model):
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name="skill_links")
    skill = models.ForeignKey(Skill, on_delete=models.PROTECT, related_name="worker_links")
    evidence_verified = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["worker", "skill"], name="unique_worker_skill")
        ]

    def __str__(self):
        return f"{self.worker} - {self.skill}"


class WorkerServiceArea(models.Model):
    worker = models.ForeignKey(WorkerProfile, on_delete=models.CASCADE, related_name="area_links")
    area = models.ForeignKey(Area, on_delete=models.PROTECT, related_name="worker_links")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["worker", "area"], name="unique_worker_area")
        ]

    def __str__(self):
        return f"{self.worker} - {self.area}"
