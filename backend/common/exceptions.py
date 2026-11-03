from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    data = response.data
    if isinstance(exc, ValidationError):
        errors = data if isinstance(data, dict) else {"non_field_errors": data}
        response.data = {"detail": "Invalid input.", "code": "invalid", "errors": errors}
        return response

    detail = data.get("detail", "") if isinstance(data, dict) else data
    response.data = {
        "detail": str(detail),
        "code": getattr(detail, "code", "error"),
        "errors": {},
    }
    return response


class Conflict(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This item is in use and cannot be deleted. Deactivate it instead."
    default_code = "in_use"
