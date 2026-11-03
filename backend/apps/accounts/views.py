from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from . import services
from .serializers import (
    AuthResponseSerializer,
    ChangeCredentialSerializer,
    LoginSerializer,
    LogoutSerializer,
    MeUpdateSerializer,
    RegisterSerializer,
    TokenPairSerializer,
    UserSerializer,
)
from .tokens import SkillPassRefreshToken, SkillPassTokenRefreshSerializer, issue_tokens


class AuthRateThrottle(ScopedRateThrottle):
    scope = "auth"

    def get_scope(self, view):
        return self.scope


def _auth_response(user, response_status=status.HTTP_200_OK):
    payload = {**issue_tokens(user), "user": UserSerializer(user).data}
    return Response(payload, status=response_status)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=RegisterSerializer, responses={201: AuthResponseSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.register_user(**serializer.validated_data)
        return _auth_response(user, status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [AuthRateThrottle]

    @extend_schema(request=LoginSerializer, responses={200: AuthResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = services.authenticate_user(
            serializer.validated_data["phone"], serializer.validated_data["password"]
        )
        return _auth_response(user)


class RefreshView(TokenRefreshView):
    serializer_class = SkillPassTokenRefreshSerializer


class LogoutView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(request=LogoutSerializer, responses={204: None})
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            SkillPassRefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @extend_schema(request=MeUpdateSerializer, responses=UserSerializer)
    def patch(self, request):
        serializer = MeUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class ChangeCredentialView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=ChangeCredentialSerializer, responses=TokenPairSerializer)
    def post(self, request):
        serializer = ChangeCredentialSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tokens = services.change_credential(
            request.user,
            current=serializer.validated_data["current_password"],
            new=serializer.validated_data["new_password"],
        )
        return Response(tokens)
