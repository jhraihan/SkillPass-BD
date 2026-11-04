import hmac

from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.bookings.services import process_timeouts


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        responses=inline_serializer("Health", fields={"status": serializers.CharField()})
    )
    def get(self, request):
        return Response({"status": "ok"})


class SupportView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        responses=inline_serializer(
            "SupportContacts",
            fields={
                "phone": serializers.CharField(),
                "whatsapp": serializers.CharField(),
                "hours": serializers.CharField(),
            },
        )
    )
    def get(self, request):
        return Response(
            {
                "phone": settings.SUPPORT_PHONE,
                "whatsapp": settings.SUPPORT_WHATSAPP,
                "hours": settings.SUPPORT_HOURS,
            }
        )


class ProcessTimeoutsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    @extend_schema(exclude=True)
    def post(self, request):
        expected = settings.CRON_TOKEN
        given = request.headers.get("X-Cron-Token", "")
        if not expected or not hmac.compare_digest(expected, given):
            return Response(
                {"detail": "Not found.", "code": "not_found", "errors": {}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(process_timeouts())
