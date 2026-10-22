from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


def user_payload(user):
    return {
        "username": user.get_username(),
        "is_staff": user.is_staff,
    }


class LoginView(ObtainAuthToken):
    """Exchange a username and password for an API token."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'

    @extend_schema(tags=['Auth'], responses={200: OpenApiTypes.OBJECT})
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        return Response({"token": token.key, **user_payload(user)})


class LogoutView(APIView):
    """Invalidate the caller's API token."""

    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=['Auth'], request=None, responses={204: None})
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=204)


class MeView(APIView):
    """Return the signed-in user, used by the frontend to restore a session."""

    @extend_schema(tags=['Auth'], responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        return Response(user_payload(request.user))
