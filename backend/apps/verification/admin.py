from django.contrib import admin

from .models import Verification, VerificationDocument


class DocumentInline(admin.TabularInline):
    model = VerificationDocument
    fields = ["original_name", "content_type", "size"]
    readonly_fields = fields
    extra = 0
    can_delete = False


@admin.register(Verification)
class VerificationAdmin(admin.ModelAdmin):
    list_display = ["id", "worker", "type", "skill_name", "status", "created_at", "reviewed_by"]
    list_filter = ["status", "type"]
    search_fields = ["worker__display_name", "worker__user__phone"]
    readonly_fields = [
        "worker",
        "type",
        "worker_skill",
        "skill_name",
        "status",
        "reviewed_by",
        "reviewed_at",
        "rejection_reason",
    ]
    inlines = [DocumentInline]

    def has_add_permission(self, request):
        return False
