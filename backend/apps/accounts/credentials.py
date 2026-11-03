import re

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

from .models import User

PIN_LENGTH = 6
_PIN_FORMAT = re.compile(r"^\d{6}$")
_COMMON_PINS = {"112233", "121212", "123123", "696969", "000123", "102030", "147258", "159753"}


def _is_sequential(pin):
    steps = {int(b) - int(a) for a, b in zip(pin, pin[1:], strict=False)}
    return steps in ({1}, {-1})


def is_weak_pin(pin, phone=""):
    digits = re.sub(r"\D", "", phone or "")
    return (
        len(set(pin)) == 1
        or _is_sequential(pin)
        or pin in _COMMON_PINS
        or (len(digits) >= PIN_LENGTH and pin == digits[-PIN_LENGTH:])
    )


def validate_worker_pin(pin, phone=""):
    if not _PIN_FORMAT.match(pin or ""):
        raise ValidationError("The PIN must be exactly 6 digits.", code="pin_format")
    if is_weak_pin(pin, phone):
        raise ValidationError(
            "This PIN is too easy to guess. Choose a different one.", code="pin_weak"
        )


def validate_credential(role, credential, *, phone="", user=None):
    if role == User.Role.WORKER:
        validate_worker_pin(credential, phone)
    else:
        validate_password(credential, user=user)
