from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm
from django.core.exceptions import ValidationError

from .models import CustomerProfile, User
from .phone import normalize_bd_phone
from .services import unlock_users


class UserCreationAdminForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("phone", "full_name", "role")

    def clean_phone(self):
        phone = normalize_bd_phone(self.cleaned_data["phone"])
        if User.objects.filter(phone=phone).exists():
            raise ValidationError("An account with this phone number already exists.")
        return phone


class UserChangeAdminForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeAdminForm
    add_form = UserCreationAdminForm
    list_display = ("phone", "full_name", "role", "is_suspended", "locked_at", "date_joined")
    list_filter = ("role", "is_suspended", "is_staff", "is_active")
    search_fields = ("phone", "full_name", "email")
    ordering = ("-date_joined",)
    readonly_fields = ("last_login", "date_joined", "failed_login_count", "last_failed_login_at")
    actions = ["unlock_selected"]
    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Profile", {"fields": ("full_name", "email", "role", "preferred_language")}),
        (
            "Security",
            {
                "fields": (
                    "is_active",
                    "is_suspended",
                    "must_change_credential",
                    "failed_login_count",
                    "last_failed_login_at",
                    "locked_at",
                )
            },
        ),
        ("Admin access", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("phone", "full_name", "role")}),
        ("Password / PIN", {"fields": ("password1", "password2")}),
    )

    @admin.action(description="Unlock selected accounts")
    def unlock_selected(self, request, queryset):
        count = unlock_users(queryset)
        self.message_user(request, f"{count} account(s) unlocked.")


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at")
    search_fields = ("user__phone", "user__full_name")
    raw_id_fields = ("user",)
