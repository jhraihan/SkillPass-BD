import django_filters
from rest_framework.filters import SearchFilter

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


SUFFIXES = ("ation", "ians", "ian", "ing", "ers", "er", "es", "e", "s")
MIN_STEM = 3


def stem(term):
    if not term.isascii():
        return term
    lowered = term.lower()
    for suffix in SUFFIXES:
        if lowered.endswith(suffix) and len(lowered) - len(suffix) >= MIN_STEM:
            return lowered[: -len(suffix)]
    return lowered


class StemmedSearchFilter(SearchFilter):
    def get_search_terms(self, request):
        return [stem(term) for term in super().get_search_terms(request)]
