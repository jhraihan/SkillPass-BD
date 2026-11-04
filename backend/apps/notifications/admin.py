from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["created_at", "recipient", "type", "title", "is_read"]
    list_filter = ["type", "is_read"]
    search_fields = ["recipient__phone", "title"]
    readonly_fields = ["recipient", "type", "title", "body", "data", "created_at"]
