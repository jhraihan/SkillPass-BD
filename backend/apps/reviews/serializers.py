from rest_framework import serializers

from apps.bookings.models import Booking
from apps.bookings.serializers import AreaBriefSerializer, CategoryBriefSerializer

from .models import RATING_FIELDS, Review
from .services import short_name

RATING = {"min_value": 1, "max_value": 5}


class ReviewCreateSerializer(serializers.Serializer):
    booking = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all())
    quality = serializers.IntegerField(**RATING)
    professionalism = serializers.IntegerField(**RATING)
    punctuality = serializers.IntegerField(**RATING)
    communication = serializers.IntegerField(**RATING)
    would_hire_again = serializers.BooleanField()
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    overall = serializers.FloatField()
    category = CategoryBriefSerializer(source="booking.service_request.category", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "customer_name",
            "category",
            *RATING_FIELDS,
            "overall",
            "would_hire_again",
            "comment",
            "created_at",
        ]

    def get_customer_name(self, review) -> str:
        return short_name(review.customer.full_name)


class WorkHistorySerializer(serializers.ModelSerializer):
    category = CategoryBriefSerializer(source="service_request.category", read_only=True)
    area = AreaBriefSerializer(source="service_request.area", read_only=True)
    skills = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = ["id", "category", "skills", "area", "closed_at", "customer_name", "review"]

    def get_skills(self, booking) -> list[dict]:
        return [
            {"id": s.id, "slug": s.slug, "name_en": s.name_en, "name_bn": s.name_bn}
            for s in booking.service_request.skills.all()
        ]

    def get_customer_name(self, booking) -> str:
        return short_name(booking.customer.full_name)

    def get_review(self, booking) -> dict | None:
        review = getattr(booking, "review", None)
        if review is None or review.is_hidden or review.is_invalid:
            return None
        return {
            "overall": float(review.overall),
            "would_hire_again": review.would_hire_again,
            "comment": review.comment,
        }
