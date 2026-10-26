import pytest
from django.core.exceptions import ValidationError

from apps.accounts.phone import normalize_bd_phone


@pytest.mark.parametrize(
    "raw",
    ["01712345678", "+8801712345678", "8801712345678", "017-1234-5678", " 01712 345678 "],
)
def test_valid_numbers_are_normalized(raw):
    assert normalize_bd_phone(raw) == "+8801712345678"


@pytest.mark.parametrize("raw", ["", "0171234567", "01212345678", "+8811712345678", "abc"])
def test_invalid_numbers_are_rejected(raw):
    with pytest.raises(ValidationError):
        normalize_bd_phone(raw)
