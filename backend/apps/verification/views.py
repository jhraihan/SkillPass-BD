from django.http import FileResponse
from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.workers.models import WorkerProfile
from common.permissions import IsAdminRole, IsWorker, has_role, is_admin

from . import services
from .models import Verification, VerificationDocument
from .serializers import (
    AdminVerificationSerializer,
    RejectSerializer,
    VerificationCreateSerializer,
    VerificationSerializer,
)


class IsWorkerOrAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return has_role(request.user, ("WORKER", "ADMIN"))


def visible_verifications(user):
    queryset = Verification.objects.select_related(
        "worker__user", "worker_skill__skill", "reviewed_by"
    ).prefetch_related("documents")
    if is_admin(user):
        return queryset
    return queryset.filter(worker__user=user)


@extend_schema(
    parameters=[
        OpenApiParameter("status", OpenApiTypes.STR, enum=Verification.Status.values),
        OpenApiParameter("type", OpenApiTypes.STR, enum=Verification.Type.values),
    ]
)
class VerificationViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsWorkerOrAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    queryset = Verification.objects.none()
    filter_backends = []

    def get_permissions(self):
        if self.action == "create":
            return [IsWorker()]
        return super().get_permissions()

    def get_serializer_class(self):
        return (
            AdminVerificationSerializer if is_admin(self.request.user) else VerificationSerializer
        )

    def get_queryset(self):
        queryset = visible_verifications(self.request.user)
        params = self.request.query_params
        if params.get("status") in Verification.Status.values:
            queryset = queryset.filter(status=params["status"])
        if params.get("type") in Verification.Type.values:
            queryset = queryset.filter(type=params["type"])
        if not is_admin(self.request.user):
            queryset = queryset.order_by("-created_at", "-pk")
        return queryset

    @extend_schema(request=VerificationCreateSerializer, responses={201: VerificationSerializer})
    def create(self, request):
        serializer = VerificationCreateSerializer(
            data={
                "type": request.data.get("type"),
                "skill": request.data.get("skill") or None,
                "files": request.FILES.getlist("files"),
            }
        )
        serializer.is_valid(raise_exception=True)
        worker = get_object_or_404(WorkerProfile, user=request.user)
        verification = services.submit(
            worker,
            serializer.validated_data["type"],
            serializer.validated_data["files"],
            skill=serializer.validated_data.get("skill"),
        )
        return Response(VerificationSerializer(verification).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=None, responses=AdminVerificationSerializer)
    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def approve(self, request, pk=None):
        verification = services.approve(self.get_object(), request.user, request=request)
        return Response(AdminVerificationSerializer(verification).data)

    @extend_schema(request=RejectSerializer, responses=AdminVerificationSerializer)
    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def reject(self, request, pk=None):
        serializer = RejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = services.reject(
            self.get_object(), request.user, serializer.validated_data["reason"], request=request
        )
        return Response(AdminVerificationSerializer(verification).data)


class DocumentView(APIView):
    permission_classes = [IsWorkerOrAdmin]

    @extend_schema(responses={(200, "application/octet-stream"): OpenApiTypes.BINARY})
    def get(self, request, pk):
        queryset = VerificationDocument.objects.select_related("verification__worker")
        if not is_admin(request.user):
            queryset = queryset.filter(verification__worker__user=request.user)
        document = get_object_or_404(queryset, pk=pk)
        response = FileResponse(
            document.file.open("rb"),
            content_type=document.content_type,
            as_attachment=False,
            filename=document.original_name,
        )
        response["Cache-Control"] = "private, no-store"
        response["X-Content-Type-Options"] = "nosniff"
        response["Content-Security-Policy"] = (
            "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"
        )
        return response
