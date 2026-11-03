from django.db import models

from apps.workers.models import WorkerProfile


class TrustScoreHistory(models.Model):
    worker = models.ForeignKey(
        WorkerProfile, on_delete=models.CASCADE, related_name="trust_history"
    )
    score = models.PositiveSmallIntegerField()
    breakdown = models.JSONField()
    trigger = models.CharField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        verbose_name_plural = "trust score history"

    def __str__(self):
        return f"{self.worker}: {self.score} ({self.trigger})"
