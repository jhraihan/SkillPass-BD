from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Platform user. Logs in with phone number; workers use a 6-digit PIN as the password."""

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        WORKER = "WORKER", "Worker"
        CONTRACTOR = "CONTRACTOR", "Contractor"
        ADMIN = "ADMIN", "Admin"

    class Language(models.TextChoices):
        BENGALI = "bn", "বাংলা"
        ENGLISH = "en", "English"

    phone = models.CharField(max_length=14, unique=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    preferred_language = models.CharField(
        max_length=2, choices=Language.choices, default=Language.BENGALI
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_suspended = models.BooleanField(default=False)

    # Set when an admin creates the account or resets the PIN/password.
    must_change_credential = models.BooleanField(default=False)
    failed_login_count = models.PositiveSmallIntegerField(default=0)
    locked_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="created_users",
    )

    date_joined = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.full_name} ({self.phone})"

    @property
    def is_worker(self):
        return self.role == self.Role.WORKER

    @property
    def is_customer(self):
        return self.role == self.Role.CUSTOMER
