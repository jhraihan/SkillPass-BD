from types import SimpleNamespace

import pytest

from common.permissions import IsAdminRole, IsCustomer, IsWorker


def _request(role, suspended=False, authenticated=True):
    user = SimpleNamespace(role=role, is_suspended=suspended, is_authenticated=authenticated)
    return SimpleNamespace(user=user)


@pytest.mark.parametrize(
    ("permission", "role", "allowed"),
    [
        (IsCustomer, "CUSTOMER", True),
        (IsCustomer, "WORKER", False),
        (IsWorker, "WORKER", True),
        (IsWorker, "ADMIN", False),
        (IsAdminRole, "ADMIN", True),
        (IsAdminRole, "CUSTOMER", False),
    ],
)
def test_role_permissions(permission, role, allowed):
    assert permission().has_permission(_request(role), view=None) is allowed


def test_suspended_users_are_rejected():
    assert IsWorker().has_permission(_request("WORKER", suspended=True), view=None) is False


def test_anonymous_users_are_rejected():
    request = _request("CUSTOMER", authenticated=False)

    assert IsCustomer().has_permission(request, view=None) is False
