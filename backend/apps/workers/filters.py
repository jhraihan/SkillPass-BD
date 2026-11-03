import django_filters

from .models import WorkerProfile


class WorkerFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="skills__category__slug")
    skill = django_filters.CharFilter(field_name="skills__slug")
    area = django_filters.CharFilter(field_name="service_areas__slug")
    min_trust = django_filters.NumberFilter(field_name="trust_score", lookup_expr="gte")
    verified = django_filters.BooleanFilter(field_name="identity_verified")
    available = django_filters.BooleanFilter(method="filter_available")

    class Meta:
        model = WorkerProfile
        fields = ["category", "skill", "area", "min_trust", "verified", "available"]

    def filter_available(self, queryset, name, value):
        if value:
            return queryset.filter(availability_status=WorkerProfile.Availability.AVAILABLE)
        return queryset
