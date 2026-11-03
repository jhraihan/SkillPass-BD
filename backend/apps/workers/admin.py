from django.contrib import admin

from .models import WorkerProfile, WorkerServiceArea, WorkerSkill


class WorkerSkillInline(admin.TabularInline):
    model = WorkerSkill
    extra = 0
    autocomplete_fields = ["skill"]


class WorkerServiceAreaInline(admin.TabularInline):
    model = WorkerServiceArea
    extra = 0
    autocomplete_fields = ["area"]


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "user",
        "availability_status",
        "identity_verified",
        "trust_score",
        "verified_jobs_count",
    )
    list_filter = ("availability_status", "identity_verified")
    search_fields = ("display_name", "user__phone", "user__full_name")
    raw_id_fields = ("user",)
    readonly_fields = (
        "trust_score",
        "completed_jobs_count",
        "verified_jobs_count",
        "avg_rating",
        "review_count",
        "last_active_at",
    )
    inlines = [WorkerSkillInline, WorkerServiceAreaInline]
