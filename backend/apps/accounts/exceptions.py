from rest_framework import status
from rest_framework.exceptions import APIException


class InvalidCredentials(APIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = "Phone number or PIN/password is incorrect."
    default_code = "invalid_credentials"


class AccountLocked(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This account is locked after too many wrong attempts. Contact support."
    default_code = "account_locked"


class AccountSuspended(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This account is suspended. Contact support."
    default_code = "account_suspended"
