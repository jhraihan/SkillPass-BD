from django.db.models import Exists, OuterRef, Prefetch
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import status, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.bookings.serializers import BookingSerializer
from common.permissions import IsWorker

from . import services
from .filters import WorkerFilter
from .models import WorkerProfile, WorkerServiceArea, WorkerSkill
from .serializers import (
    AreaIdsSerializer,
    MyWorkerProfileSerializer,
    PhotoSerializer,
    SkillIdsSerializer,
    WorkerCardSerializer,
    WorkerPublicSerializer,
)


def with_relations(queryset):
    return queryset.select_related("user").prefetch_related(
        Prefetch(
            "skill_links",
            queryset=WorkerSkill.objects.select_related("skill__category").order_by(
                "skill__category__sort_order", "skill__sort_order"
            ),
        ),
        Prefetch("area_links", queryset=WorkerServiceArea.objects.select_related("area")),
    )


def visible_workers():
    return WorkerProfile.objects.filter(user__is_active=True, user__is_suspended=False)


class WorkerViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_value_regex = r"\d+"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = WorkerFilter
    search_fields = ["display_name", "skills__name_en", "skills__name_bn"]
    ordering_fields = [
        "trust_score",
        "avg_rating",
        "verified_jobs_count",
        "years_experience",
        "created_at",
    ]
    ordering = ["-trust_score", "-verified_jobs_count", "display_name"]

    def get_queryset(self):
        queryset = visible_workers()
        if self.action == "list":
            has_skill = WorkerSkill.objects.filter(worker=OuterRef("pk"))
            has_area = WorkerServiceArea.objects.filter(worker=OuterRef("pk"))
            queryset = queryset.filter(Exists(has_skill), Exists(has_area)).distinct()
        return with_relations(queryset)

    def get_serializer_class(self):
        return WorkerCardSerializer if self.action == "list" else WorkerPublicSerializer


def _my_profile_response(request, profile):
    profile = with_relations(WorkerProfile.objects.filter(pk=profile.pk)).get()
    return Response(MyWorkerProfileSerializer(profile, context={"request": request}).data)


class MyWorkerProfileView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(responses=MyWorkerProfileSerializer)
    def get(self, request):
        return _my_profile_response(request, services.profile_for(request.user))

    @extend_schema(request=MyWorkerProfileSerializer, responses=MyWorkerProfileSerializer)
    def patch(self, request):
        profile = services.profile_for(request.user)
        serializer = MyWorkerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return _my_profile_response(request, profile)


class MySkillsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(request=SkillIdsSerializer, responses=MyWorkerProfileSerializer)
    def put(self, request):
        serializer = SkillIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.profile_for(request.user)
        services.set_skills(profile, serializer.validated_data["skills"])
        return _my_profile_response(request, profile)


class MyAreasView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(request=AreaIdsSerializer, responses=MyWorkerProfileSerializer)
    def put(self, request):
        serializer = AreaIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.profile_for(request.user)
        services.set_service_areas(profile, serializer.validated_data["areas"])
        return _my_profile_response(request, profile)


class MyPhotoView(APIView):
    permission_classes = [IsWorker]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(request=PhotoSerializer, responses=MyWorkerProfileSerializer)
    def post(self, request):
        serializer = PhotoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = services.profile_for(request.user)
        services.set_photo(profile, serializer.validated_data["photo"])
        return _my_profile_response(request, profile)

    @extend_schema(responses={204: None})
    def delete(self, request):
        services.remove_photo(services.profile_for(request.user))
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkerDashboardView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(
        responses=inline_serializer(
            "WorkerDashboard",
            fields={
                "profile": MyWorkerProfileSerializer(),
                "pending_requests": BookingSerializer(many=True),
                "today_jobs": BookingSerializer(many=True),
            },
        )
    )
    def get(self, request):
        profile = with_relations(
            WorkerProfile.objects.filter(pk=services.profile_for(request.user).pk)
        ).get()
        bookings = Booking.objects.filter(worker=profile).select_related(
            "customer", "worker__user", "service_request__category", "service_request__area"
        )
        pending = bookings.filter(status=Booking.Status.PENDING)
        in_hand = [s for s in Booking.ACTIVE_STATUSES if s != Booking.Status.PENDING]
        today = bookings.filter(
            status__in=in_hand, service_request__preferred_date__lte=timezone.localdate()
        )
        context = {"request": request}
        return Response(
            {
                "profile": MyWorkerProfileSerializer(profile, context=context).data,
                "pending_requests": BookingSerializer(pending, many=True, context=context).data,
                "today_jobs": BookingSerializer(today, many=True, context=context).data,
            }
        )
