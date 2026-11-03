from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "target_type",
        "target_id",
        "reason",
        "status",
        "is_dispute",
        "created_at",
    ]
    list_filter = ["status", "target_type", "reason", "is_dispute"]
    search_fields = ["description", "reporter__phone"]
    readonly_fields = [
        "reporter",
        "target_type",
        "target_id",
        "reason",
        "description",
        "is_dispute",
        "status",
        "assigned_admin",
        "resolution_note",
        "fault",
        "resolved_at",
    ]

    def has_add_permission(self, request):
        return False
