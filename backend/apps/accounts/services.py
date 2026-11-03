from datetime import timedelta

from django.contrib.auth.models import update_last_login
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.workers.services import create_worker_profile

from .exceptions import AccountLocked, AccountSuspended, InvalidCredentials
from .models import CustomerProfile, User
from .phone import normalize_bd_phone
from .tokens import issue_tokens, revoke_all_tokens

MAX_FAILED_LOGINS = 10
FAILED_LOGIN_WINDOW = timedelta(hours=24)


@transaction.atomic
def register_user(*, role, full_name, phone, password, email=None, preferred_language=None):
    extra = {"preferred_language": preferred_language} if preferred_language else {}
    user = User.objects.create_user(
        phone=phone, password=password, full_name=full_name, role=role, email=email, **extra
    )
    if role == User.Role.CUSTOMER:
        CustomerProfile.objects.create(user=user)
    elif role == User.Role.WORKER:
        create_worker_profile(user)
    return user


def authenticate_user(phone, credential):
    try:
        phone = normalize_bd_phone(phone)
    except ValidationError as error:
        raise InvalidCredentials() from error

    user = User.objects.filter(phone=phone).first()
    if user is None:
        User().set_password(credential)
        raise InvalidCredentials()
    if user.locked_at:
        raise AccountLocked()
    if not user.is_active or user.is_suspended:
        raise AccountSuspended()
    if not user.check_password(credential):
        if _record_failed_login(user):
            raise AccountLocked()
        raise InvalidCredentials()

    if user.failed_login_count:
        User.objects.filter(pk=user.pk).update(failed_login_count=0, last_failed_login_at=None)
    update_last_login(None, user)
    return user


@transaction.atomic
def _record_failed_login(user):
    user = User.objects.select_for_update().get(pk=user.pk)
    now = timezone.now()
    window_expired = (
        user.last_failed_login_at is None or now - user.last_failed_login_at > FAILED_LOGIN_WINDOW
    )
    user.failed_login_count = 1 if window_expired else user.failed_login_count + 1
    user.last_failed_login_at = now
    if user.failed_login_count >= MAX_FAILED_LOGINS:
        user.locked_at = now
    user.save(update_fields=["failed_login_count", "last_failed_login_at", "locked_at"])
    return user.locked_at is not None


@transaction.atomic
def change_credential(user, *, current, new):
    if not user.check_password(current):
        raise serializers.ValidationError(
            {"current_password": ["The current PIN/password is incorrect."]}
        )
    user.set_password(new)
    user.must_change_credential = False
    user.save(update_fields=["password", "must_change_credential", "updated_at"])
    revoke_all_tokens(user)
    return issue_tokens(user)


def unlock_users(queryset):
    return queryset.update(locked_at=None, failed_login_count=0, last_failed_login_at=None)
