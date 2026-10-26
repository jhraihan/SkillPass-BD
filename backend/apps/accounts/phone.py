import re

from django.core.exceptions import ValidationError

# Bangladesh mobile numbers: 013–019 operators, 11 digits locally.
_BD_MOBILE = re.compile(r"^(?:\+?880|0)(1[3-9]\d{8})$")


def normalize_bd_phone(value: str) -> str:
    """Return the number as +8801XXXXXXXXX, or raise ValidationError."""
    cleaned = re.sub(r"[\s\-()]", "", value or "")
    match = _BD_MOBILE.match(cleaned)
    if not match:
        raise ValidationError("Enter a valid Bangladeshi mobile number.", code="invalid_phone")
    return f"+880{match.group(1)}"
