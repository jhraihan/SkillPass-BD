from django.db.models import Q
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.workers.models import WorkerProfile
from apps.workers.serializers import WorkerCardSerializer
from apps.workers.views import with_relations
from common.permissions import IsCustomer, is_admin

from . import services
from .models import Booking, ServiceRequest
from .serializers import (
    BookingActionSerializer,
    BookingCreateSerializer,
    BookingDetailSerializer,
    BookingSerializer,
    ServiceRequestSerializer,
)


class ServiceRequestViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ServiceRequest.objects.none()
    serializer_class = ServiceRequestSerializer
    permission_classes = [IsCustomer]
    http_method_names = ["get", "post", "patch"]
    filter_backends = []

    def get_queryset(self):
        return (
            ServiceRequest.objects.filter(customer=self.request.user)
            .select_related("category", "area")
            .prefetch_related("skills", "bookings")
        )

    def perform_create(self, serializer):
        data = dict(serializer.validated_data)
        skills = data.pop("skills", [])
        serializer.instance = services.create_service_request(
            self.request.user, skills=skills, **data
        )

    def perform_update(self, serializer):
        if serializer.instance.status != ServiceRequest.Status.OPEN:
            raise serializers.ValidationError({"detail": "Only open requests can be edited."})
        serializer.save()

    @extend_schema(request=None, responses=ServiceRequestSerializer)
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        service_request = services.cancel_service_request(self.get_object(), request.user)
        return Response(self.get_serializer(service_request).data)

    @extend_schema(responses=WorkerCardSerializer(many=True))
    @action(detail=True, methods=["get"])
    def matches(self, request, pk=None):
        matches = services.match_workers(self.get_object())
        ids = [worker.pk for _, worker, _ in matches]
        workers = {w.pk: w for w in with_relations(WorkerProfile.objects.filter(pk__in=ids))}
        context = self.get_serializer_context()
        return Response(
            [
                {
                    **WorkerCardSerializer(workers[worker.pk], context=context).data,
                    "match_score": score,
                    "match_reasons": reasons,
                }
                for score, worker, reasons in matches
            ]
        )


SCOPE_PARAM = OpenApiParameter(
    "scope", OpenApiTypes.STR, enum=["active", "today", "upcoming", "past"]
)
ACTION_SCHEMA = extend_schema(request=BookingActionSerializer, responses=BookingDetailSerializer)


@extend_schema_view(list=extend_schema(parameters=[SCOPE_PARAM]))
class BookingViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Booking.objects.none()
    permission_classes = [IsAuthenticated]
    filter_backends = []

    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.select_related(
            "customer",
            "worker__user",
            "service_request__category",
            "service_request__area",
        ).prefetch_related("service_request__skills", "history")
        if not is_admin(user):
            queryset = queryset.filter(Q(customer=user) | Q(worker__user=user))
        return self._scoped(queryset)

    def _scoped(self, queryset):
        scope = self.request.query_params.get("scope")
        today = timezone.localdate()
        active = Q(status__in=Booking.ACTIVE_STATUSES)
        if scope == "active":
            return queryset.filter(active)
        if scope == "today":
            return queryset.filter(active, service_request__preferred_date__lte=today)
        if scope == "upcoming":
            return queryset.filter(active, service_request__preferred_date__gt=today)
        if scope == "past":
            return queryset.exclude(active)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        if self.action == "list":
            return BookingSerializer
        return BookingDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            return [IsCustomer()]
        return super().get_permissions()

    def _detail(self, booking, response_status=status.HTTP_200_OK):
        booking = self.get_queryset().get(pk=booking.pk)
        context = self.get_serializer_context()
        return Response(
            BookingDetailSerializer(booking, context=context).data, status=response_status
        )

    @extend_schema(request=BookingCreateSerializer, responses={201: BookingDetailSerializer})
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = services.create_booking(
            serializer.validated_data["service_request"], serializer.validated_data["worker"]
        )
        return self._detail(booking, status.HTTP_201_CREATED)

    def _run(self, request, action_name):
        booking = self.get_object()
        serializer = BookingActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data.get("note", "").strip()
        if action_name in services.REASON_REQUIRED and not note:
            raise serializers.ValidationError({"note": ["Please give a reason."]})
        services.transition(booking.pk, services.ACTIONS[action_name], request.user, note)
        return self._detail(booking)

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        return self._run(request, "accept")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        return self._run(request, "decline")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"], url_path="on-the-way")
    def on_the_way(self, request, pk=None):
        return self._run(request, "on-the-way")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        return self._run(request, "start")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"], url_path="mark-complete")
    def mark_complete(self, request, pk=None):
        return self._run(request, "mark-complete")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        return self._run(request, "confirm")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        return self._run(request, "cancel")

    @ACTION_SCHEMA
    @action(detail=True, methods=["post"])
    def dispute(self, request, pk=None):
        return self._run(request, "dispute")
