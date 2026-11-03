from django.db.models import Count, ProtectedError, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets

from common.exceptions import Conflict
from common.permissions import IsAdminOrReadOnly, is_admin

from .models import Area, District, ServiceCategory, Skill
from .serializers import (
    AreaSerializer,
    DistrictSerializer,
    ServiceCategorySerializer,
    SkillSerializer,
)

INCLUDE_INACTIVE = OpenApiParameter(
    "include_inactive", OpenApiTypes.BOOL, description="Admins only: also list inactive items."
)


class CatalogViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = []

    def visible(self, queryset):
        wants_all = self.request.query_params.get("include_inactive") in ("1", "true")
        if wants_all and is_admin(self.request.user):
            return queryset
        return queryset.filter(is_active=True)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError as error:
            raise Conflict() from error


@extend_schema_view(list=extend_schema(parameters=[INCLUDE_INACTIVE]))
class ServiceCategoryViewSet(CatalogViewSet):
    serializer_class = ServiceCategorySerializer

    def get_queryset(self):
        active_skills = Count("skills", filter=Q(skills__is_active=True))
        categories = ServiceCategory.objects.annotate(skill_count=active_skills)
        return self.visible(categories.order_by("sort_order", "name_en"))


@extend_schema_view(
    list=extend_schema(
        parameters=[
            INCLUDE_INACTIVE,
            OpenApiParameter("category", OpenApiTypes.STR, description="Category slug"),
        ]
    )
)
class SkillViewSet(CatalogViewSet):
    serializer_class = SkillSerializer

    def get_queryset(self):
        queryset = self.visible(Skill.objects.select_related("category"))
        if self.action == "list" and not is_admin(self.request.user):
            queryset = queryset.filter(category__is_active=True)
        category = self.request.query_params.get("category")
        return queryset.filter(category__slug=category) if category else queryset


@extend_schema_view(
    list=extend_schema(
        parameters=[
            INCLUDE_INACTIVE,
            OpenApiParameter("district", OpenApiTypes.STR, description="District slug"),
        ]
    )
)
class AreaViewSet(CatalogViewSet):
    serializer_class = AreaSerializer

    def get_queryset(self):
        queryset = self.visible(Area.objects.select_related("district"))
        district = self.request.query_params.get("district")
        return queryset.filter(district__slug=district) if district else queryset


class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DistrictSerializer
    queryset = District.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None
    filter_backends = []
