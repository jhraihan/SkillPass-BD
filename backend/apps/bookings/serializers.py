from django.utils import timezone
from rest_framework import serializers

from apps.catalog.models import Area, ServiceCategory, Skill
from apps.workers.models import WorkerProfile

from . import services
from .models import Booking, BookingStatusHistory, ServiceRequest


class CategoryBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ["id", "slug", "name_en", "name_bn", "icon"]


class SkillBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "slug", "name_en", "name_bn"]


class AreaBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ["id", "slug", "name_en", "name_bn"]


class ServiceRequestSerializer(serializers.ModelSerializer):
    category_detail = CategoryBriefSerializer(source="category", read_only=True)
    skills_detail = SkillBriefSerializer(source="skills", many=True, read_only=True)
    area_detail = AreaBriefSerializer(source="area", read_only=True)
    active_booking = serializers.SerializerMethodField()

    class Meta:
        model = ServiceRequest
        fields = [
            "id",
            "category",
            "category_detail",
            "skills",
            "skills_detail",
            "description",
            "area",
            "area_detail",
            "address_detail",
            "preferred_date",
            "preferred_slot",
            "status",
            "active_booking",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]
        extra_kwargs = {"skills": {"required": False}}

    def get_active_booking(self, request) -> int | None:
        active = [b for b in request.bookings.all() if b.status in Booking.ACTIVE_STATUSES]
        return active[0].pk if active else None

    def validate_category(self, category):
        if not category.is_active:
            raise serializers.ValidationError("This service is not available.")
        return category

    def validate_area(self, area):
        if not area.is_active:
            raise serializers.ValidationError("This area is not available.")
        return area

    def validate_preferred_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Choose today or a later date.")
        return value

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        skills = attrs.get("skills", [])
        if any(skill.category_id != category.id or not skill.is_active for skill in skills):
            raise serializers.ValidationError({"skills": ["Choose skills from this service."]})
        return attrs


class HistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingStatusHistory
        fields = ["from_status", "to_status", "actor_role", "note", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    request = serializers.SerializerMethodField()
    worker = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    contact_visible = serializers.BooleanField(read_only=True)
    allowed_actions = serializers.SerializerMethodField()
    has_review = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "request",
            "worker",
            "customer",
            "contact_visible",
            "allowed_actions",
            "accepted_at",
            "started_at",
            "work_done_at",
            "closed_at",
            "cancel_reason",
            "dispute_reason",
            "completion_notes",
            "is_verified",
            "has_review",
            "created_at",
        ]

    def _viewer(self):
        return self.context["request"].user

    def _is_worker_view(self, booking):
        return self._viewer().pk == booking.worker.user_id

    def get_request(self, booking) -> dict:
        request = booking.service_request
        data = ServiceRequestSerializer(request).data
        data.pop("active_booking", None)
        if self._is_worker_view(booking) and not booking.contact_visible:
            data["address_detail"] = None
        return data

    def get_worker(self, booking) -> dict:
        worker = booking.worker
        request = self.context["request"]
        photo = request.build_absolute_uri(worker.photo.url) if worker.photo else None
        return {
            "id": worker.pk,
            "display_name": worker.display_name,
            "photo": photo,
            "trust_score": worker.trust_score,
            "is_new": worker.is_new,
            "phone": worker.user.phone if booking.contact_visible else None,
        }

    def get_customer(self, booking) -> dict:
        customer = booking.customer
        full = booking.contact_visible or not self._is_worker_view(booking)
        return {
            "name": customer.full_name if full else customer.full_name.split()[0],
            "phone": customer.phone if booking.contact_visible else None,
        }

    def get_has_review(self, booking) -> bool:
        return hasattr(booking, "review")

    def get_allowed_actions(self, booking) -> list[str]:
        return services.allowed_actions(booking, self._viewer())


class BookingDetailSerializer(BookingSerializer):
    history = HistorySerializer(many=True, read_only=True)

    class Meta(BookingSerializer.Meta):
        fields = [*BookingSerializer.Meta.fields, "history"]


class BookingCreateSerializer(serializers.Serializer):
    service_request = serializers.PrimaryKeyRelatedField(queryset=ServiceRequest.objects.none())
    worker = serializers.PrimaryKeyRelatedField(queryset=WorkerProfile.objects.all())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None:
            self.fields["service_request"].queryset = ServiceRequest.objects.filter(
                customer=request.user
            )


class BookingActionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class MatchSerializer(serializers.Serializer):
    score = serializers.FloatField()
    reasons = serializers.ListField(child=serializers.DictField())
