from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminRole

from . import admin_services
from .admin_stats import PERIODS, dashboard_stats
from .models import User
from .serializers import PhoneField

STATES = {
    "active": Q(is_suspended=False, locked_at__isnull=True),
    "suspended": Q(is_suspended=True),
    "locked": Q(locked_at__isnull=False),
}


class AdminUserSerializer(serializers.ModelSerializer):
    is_locked = serializers.SerializerMethodField()
    worker_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "full_name",
            "phone",
            "role",
            "is_suspended",
            "is_locked",
            "failed_login_count",
            "must_change_credential",
            "date_joined",
            "last_login",
            "worker_profile_id",
        ]

    def get_is_locked(self, user) -> bool:
        return user.locked_at is not None

    def get_worker_profile_id(self, user) -> int | None:
        profile = getattr(user, "worker_profile", None)
        return profile.id if profile else None


class OnboardWorkerSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    phone = PhoneField(max_length=20)
    preferred_language = serializers.ChoiceField(
        choices=User.Language.choices, default=User.Language.BENGALI
    )

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "An account with this phone number already exists.", code="phone_taken"
            )
        return value


class SuspendSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500)


CredentialResponse = inline_serializer(
    "TemporaryCredential",
    {
        "user": AdminUserSerializer(),
        "kind": serializers.ChoiceField(choices=["pin", "password"]),
        "temporary_credential": serializers.CharField(),
    },
)


@extend_schema(
    parameters=[
        OpenApiParameter("search", OpenApiTypes.STR),
        OpenApiParameter("role", OpenApiTypes.STR, enum=User.Role.values),
        OpenApiParameter("state", OpenApiTypes.STR, enum=list(STATES)),
    ]
)
class AdminUserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAdminRole]
    serializer_class = AdminUserSerializer
    queryset = User.objects.none()
    filter_backends = []

    def get_queryset(self):
        queryset = User.objects.select_related("worker_profile").order_by("-date_joined")
        params = self.request.query_params
        term = params.get("search", "").strip()
        if term:
            queryset = queryset.filter(Q(full_name__icontains=term) | Q(phone__icontains=term))
        if params.get("role") in User.Role.values:
            queryset = queryset.filter(role=params["role"])
        if params.get("state") in STATES:
            queryset = queryset.filter(STATES[params["state"]])
        return queryset

    def _respond(self, user):
        user.refresh_from_db()
        return Response(AdminUserSerializer(user).data)

    @extend_schema(request=SuspendSerializer, responses=AdminUserSerializer)
    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        serializer = SuspendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.get_object()
        admin_services.suspend_user(
            user, request.user, serializer.validated_data["reason"], request
        )
        return self._respond(user)

    @extend_schema(request=None, responses=AdminUserSerializer)
    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        user = self.get_object()
        admin_services.reactivate_user(user, request.user, request)
        return self._respond(user)

    @extend_schema(request=None, responses=AdminUserSerializer)
    @action(detail=True, methods=["post"])
    def unlock(self, request, pk=None):
        user = self.get_object()
        admin_services.unlock_user(user, request.user, request)
        return self._respond(user)

    @extend_schema(request=None, responses=CredentialResponse)
    @action(detail=True, methods=["post"], url_path="reset-credential")
    def reset_credential(self, request, pk=None):
        user = self.get_object()
        credential, kind = admin_services.reset_credential(user, request.user, request)
        user.refresh_from_db()
        response = Response(
            {
                "user": AdminUserSerializer(user).data,
                "kind": kind,
                "temporary_credential": credential,
            }
        )
        response["Cache-Control"] = "no-store"
        return response


class AdminStatsView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(
        parameters=[OpenApiParameter("days", OpenApiTypes.INT, enum=list(PERIODS))],
        responses=OpenApiTypes.OBJECT,
    )
    def get(self, request):
        try:
            days = int(request.query_params.get("days", 30))
        except ValueError:
            days = 30
        return Response(dashboard_stats(days))


class OnboardWorkerView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(request=OnboardWorkerSerializer, responses={201: CredentialResponse})
    def post(self, request):
        serializer = OnboardWorkerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, pin = admin_services.onboard_worker(
            request.user, request=request, **serializer.validated_data
        )
        response = Response(
            {"user": AdminUserSerializer(user).data, "kind": "pin", "temporary_credential": pin},
            status=201,
        )
        response["Cache-Control"] = "no-store"
        return response
