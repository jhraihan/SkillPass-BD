import secrets
import string

from django.db import transaction
from rest_framework import serializers

from apps.audit.services import record

from .credentials import is_weak_pin
from .models import User
from .services import register_user
from .tokens import revoke_all_tokens

PASSWORD_ALPHABET = string.ascii_letters + string.digits


def _not_self(user, admin):
    if user.pk == admin.pk:
        raise serializers.ValidationError({"detail": ["You cannot do this to your own account."]})


@transaction.atomic
def suspend_user(user, admin, reason, request=None):
    _not_self(user, admin)
    if not user.is_suspended:
        user.is_suspended = True
        user.save(update_fields=["is_suspended", "updated_at"])
        revoke_all_tokens(user)
        record(admin, "user.suspended", user, {"reason": reason}, request)
    return user


@transaction.atomic
def reactivate_user(user, admin, request=None):
    _not_self(user, admin)
    if user.is_suspended:
        user.is_suspended = False
        user.save(update_fields=["is_suspended", "updated_at"])
        record(admin, "user.reactivated", user, {}, request)
    return user


@transaction.atomic
def unlock_user(user, admin, request=None):
    if user.locked_at or user.failed_login_count:
        user.locked_at = None
        user.failed_login_count = 0
        user.last_failed_login_at = None
        user.save(
            update_fields=["locked_at", "failed_login_count", "last_failed_login_at", "updated_at"]
        )
        record(admin, "user.unlocked", user, {}, request)
    return user


def temporary_pin(phone):
    while True:
        pin = "".join(secrets.choice(string.digits) for _ in range(6))
        if not is_weak_pin(pin, phone):
            return pin


def temporary_password():
    while True:
        password = "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(12))
        if any(c.isdigit() for c in password) and any(c.isalpha() for c in password):
            return password


@transaction.atomic
def reset_credential(user, admin, request=None):
    _not_self(user, admin)
    is_worker = user.role == User.Role.WORKER
    credential = temporary_pin(user.phone) if is_worker else temporary_password()
    user.set_password(credential)
    user.must_change_credential = True
    user.locked_at = None
    user.failed_login_count = 0
    user.last_failed_login_at = None
    user.save()
    revoke_all_tokens(user)
    record(
        admin, "user.credential_reset", user, {"kind": "pin" if is_worker else "password"}, request
    )
    return credential, ("pin" if is_worker else "password")


@transaction.atomic
def onboard_worker(admin, full_name, phone, preferred_language=User.Language.BENGALI, request=None):
    pin = temporary_pin(phone)
    user = register_user(
        role=User.Role.WORKER,
        full_name=full_name,
        phone=phone,
        password=pin,
        preferred_language=preferred_language,
    )
    user.must_change_credential = True
    user.created_by = admin
    user.save(update_fields=["must_change_credential", "created_by", "updated_at"])
    record(admin, "user.onboarded", user, {"role": user.role}, request)
    return user, pin
