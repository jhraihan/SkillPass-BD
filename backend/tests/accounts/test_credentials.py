import pytest
from django.core.exceptions import ValidationError

from apps.accounts.credentials import is_weak_pin, validate_worker_pin


@pytest.mark.parametrize(
    "pin", ["000000", "111111", "123456", "654321", "234567", "112233", "121212"]
)
def test_weak_pins_are_detected(pin):
    assert is_weak_pin(pin)


def test_last_six_digits_of_phone_are_weak():
    assert is_weak_pin("345678", phone="+8801712345678")


@pytest.mark.parametrize("pin", ["482915", "730264", "905183"])
def test_strong_pins_pass(pin):
    validate_worker_pin(pin, phone="+8801712345678")


@pytest.mark.parametrize("pin", ["12345", "1234567", "12a456", "", "48 915"])
def test_pin_must_be_six_digits(pin):
    with pytest.raises(ValidationError) as error:
        validate_worker_pin(pin)
    assert error.value.code == "pin_format"


def test_weak_pin_error_code():
    with pytest.raises(ValidationError) as error:
        validate_worker_pin("123456")
    assert error.value.code == "pin_weak"
