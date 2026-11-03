from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdminRole, has_role, is_admin

from . import services
from .models import Report
from .serializers import (
    AdminReportSerializer,
    ReportCreateSerializer,
    ReportSerializer,
    ResolveSerializer,
)


class CanReport(IsAuthenticated):
    def has_permission(self, request, view):
        return has_role(request.user, ("CUSTOMER", "WORKER", "ADMIN"))


@extend_schema(
    parameters=[
        OpenApiParameter("status", OpenApiTypes.STR, enum=Report.Status.values),
        OpenApiParameter("target_type", OpenApiTypes.STR, enum=Report.Target.values),
        OpenApiParameter("dispute", OpenApiTypes.BOOL),
    ]
)
class ReportViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [CanReport]
    queryset = Report.objects.none()
    filter_backends = []

    def get_serializer_class(self):
        return AdminReportSerializer if is_admin(self.request.user) else ReportSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Report.objects.select_related("reporter", "assigned_admin")
        if not is_admin(user):
            return queryset.filter(reporter=user).order_by("-created_at", "-pk")
        params = self.request.query_params
        if params.get("status") in Report.Status.values:
            queryset = queryset.filter(status=params["status"])
        if params.get("target_type") in Report.Target.values:
            queryset = queryset.filter(target_type=params["target_type"])
        if params.get("dispute") in ("true", "false"):
            queryset = queryset.filter(is_dispute=params["dispute"] == "true")
        return queryset

    @extend_schema(request=ReportCreateSerializer, responses={201: ReportSerializer})
    def create(self, request):
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = services.create_report(request.user, **serializer.validated_data)
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=AdminReportSerializer)
    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def take(self, request, pk=None):
        report = services.take(self.get_object(), request.user, request=request)
        return Response(AdminReportSerializer(report).data)

    @extend_schema(request=ResolveSerializer, responses=AdminReportSerializer)
    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def resolve(self, request, pk=None):
        serializer = ResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = services.resolve(
            self.get_object(), request.user, serializer.validated_data, request=request
        )
        return Response(AdminReportSerializer(report).data)
