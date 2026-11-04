from django.conf import settings
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


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
