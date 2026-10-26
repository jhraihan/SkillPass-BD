from rest_framework.permissions import BasePermission


class HasRole(BasePermission):
    """Base class: allow authenticated, non-suspended users whose role is in `roles`."""

    roles: tuple[str, ...] = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not getattr(user, "is_suspended", False)
            and user.role in self.roles
        )


class IsCustomer(HasRole):
    roles = ("CUSTOMER",)


class IsWorker(HasRole):
    roles = ("WORKER",)


class IsAdminRole(HasRole):
    roles = ("ADMIN",)
