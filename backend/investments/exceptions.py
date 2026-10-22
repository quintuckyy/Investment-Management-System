from django.db.models import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    """DRF's default handling, plus a clear 409 when a delete is blocked by related records."""
    response = exception_handler(exc, context)

    if response is None and isinstance(exc, (ProtectedError, RestrictedError)):
        blocking_objects = (
            exc.protected_objects if isinstance(exc, ProtectedError) else exc.restricted_objects
        )
        blocking = sorted({str(obj._meta.verbose_name_plural) for obj in blocking_objects})

        return Response(
            {
                "error": (
                    "This record cannot be deleted because it is still referenced by "
                    f"{', '.join(blocking)}. Remove or reassign those first."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )

    return response
