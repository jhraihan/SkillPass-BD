from django.contrib import admin

from .models import TrustScoreHistory


@admin.register(TrustScoreHistory)
class TrustScoreHistoryAdmin(admin.ModelAdmin):
    list_display = ("worker", "score", "trigger", "created_at")
    list_filter = ("trigger",)
    search_fields = ("worker__display_name",)
    readonly_fields = ("worker", "score", "breakdown", "trigger", "created_at")
