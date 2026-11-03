from rest_framework import status
from rest_framework.exceptions import APIException


class InvalidTransition(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This booking cannot move to that status now."
    default_code = "invalid_transition"


class ActionNotAllowed(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You cannot do this on this booking."
    default_code = "action_not_allowed"


class WorkerBusy(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "Finish your current job before starting another one."
    default_code = "worker_busy"


class RequestNotOpen(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "This request already has an active booking or is closed."
    default_code = "request_not_open"
