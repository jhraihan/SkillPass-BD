from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.models import Booking
from apps.workers.models import WorkerProfile
from apps.workers.views import visible_workers
from common.permissions import IsCustomer, IsWorker

from . import services
from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer, WorkHistorySerializer


class ReviewCreateView(APIView):
    permission_classes = [IsCustomer]

    @extend_schema(request=ReviewCreateSerializer, responses={201: ReviewSerializer})
    def post(self, request):
        serializer = ReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        booking = data.pop("booking")
        review = services.create_review(booking, request.user, **data)
        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class WorkerScopedListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    filter_backends = []
    mine = False

    def get_permissions(self):
        return [IsWorker()] if self.mine else super().get_permissions()

    def worker(self):
        if self.mine:
            return get_object_or_404(WorkerProfile, user=self.request.user)
        return get_object_or_404(visible_workers(), pk=self.kwargs["worker_id"])


class WorkerReviewsView(WorkerScopedListView):
    serializer_class = ReviewSerializer
    queryset = Review.objects.none()

    def get_queryset(self):
        return Review.objects.filter(
            worker=self.worker(), is_hidden=False, is_invalid=False
        ).select_related("customer", "booking__service_request__category")


class WorkHistoryView(WorkerScopedListView):
    serializer_class = WorkHistorySerializer
    queryset = Booking.objects.none()

    def get_queryset(self):
        return (
            Booking.objects.filter(worker=self.worker(), is_verified=True)
            .select_related(
                "customer", "review", "service_request__category", "service_request__area"
            )
            .prefetch_related("service_request__skills")
            .order_by("-closed_at")
        )
