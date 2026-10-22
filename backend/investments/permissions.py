from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsStaffOrReadOnly(BasePermission):
    """Any authenticated user can read; only staff users can create, change or delete."""

    def has_permission(self, request, view):
        user = request.user

        if not (user and user.is_authenticated):
            return False

        if request.method in SAFE_METHODS:
            return True

        return user.is_staff
