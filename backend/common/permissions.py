from rest_framework.permissions import SAFE_METHODS, BasePermission


def has_role(user, roles):
    return bool(
        user
        and user.is_authenticated
        and not getattr(user, "is_suspended", False)
        and user.role in roles
    )


def is_admin(user):
    return has_role(user, ("ADMIN",))


class HasRole(BasePermission):
    roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        return has_role(request.user, self.roles)


class IsCustomer(HasRole):
    roles = ("CUSTOMER",)


class IsWorker(HasRole):
    roles = ("WORKER",)


class IsAdminRole(HasRole):
    roles = ("ADMIN",)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or is_admin(request.user)
