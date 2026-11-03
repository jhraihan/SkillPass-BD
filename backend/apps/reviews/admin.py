from django.contrib import admin

from apps.trust.services import recalculate

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("booking", "worker", "customer", "overall", "is_hidden", "is_invalid")
    list_filter = ("is_hidden", "is_invalid", "would_hire_again")
    search_fields = ("worker__display_name", "customer__full_name", "comment")
    raw_id_fields = ("booking", "customer", "worker")
    readonly_fields = ("overall",)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        recalculate(obj.worker, trigger="review_moderated")
