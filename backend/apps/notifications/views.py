from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "title", "body", "data", "is_read", "created_at"]


CountResponse = inline_serializer("UnreadCount", {"count": serializers.IntegerField()})
MarkedResponse = inline_serializer("MarkedRead", {"updated": serializers.IntegerField()})


@extend_schema(
    parameters=[
        OpenApiParameter("unread", OpenApiTypes.BOOL),
        OpenApiParameter("type", OpenApiTypes.STR, enum=Notification.Type.values),
    ]
)
class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    queryset = Notification.objects.none()
    filter_backends = []

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        params = self.request.query_params
        if params.get("unread") == "true":
            queryset = queryset.filter(is_read=False)
        if params.get("type") in Notification.Type.values:
            queryset = queryset.filter(type=params["type"])
        return queryset

    @extend_schema(responses=CountResponse)
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        return Response({"count": services.unread_count(request.user)})

    @extend_schema(request=None, responses=MarkedResponse)
    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        return Response({"updated": services.mark_read(request.user, int(pk))})

    @extend_schema(request=None, responses=MarkedResponse)
    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        return Response({"updated": services.mark_read(request.user)})
