from django.contrib import admin

from .models import Booking, BookingStatusHistory, ServiceRequest


class HistoryInline(admin.TabularInline):
    model = BookingStatusHistory
    extra = 0
    can_delete = False
    readonly_fields = ("from_status", "to_status", "actor", "actor_role", "note", "created_at")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "customer", "worker", "created_at", "is_verified")
    list_filter = ("status", "is_verified")
    search_fields = ("customer__phone", "customer__full_name", "worker__display_name")
    raw_id_fields = ("service_request", "customer", "worker", "cancelled_by")
    readonly_fields = ("status",)
    inlines = [HistoryInline]


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "category", "area", "preferred_date", "status")
    list_filter = ("status", "category", "preferred_slot")
    search_fields = ("customer__phone", "description")
    raw_id_fields = ("customer",)
    filter_horizontal = ("skills",)
