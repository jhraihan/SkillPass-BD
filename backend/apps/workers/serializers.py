from rest_framework import serializers

from apps.catalog.models import Area

from . import services
from .models import WorkerProfile, WorkerSkill


class WorkerSkillSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="skill.id")
    slug = serializers.CharField(source="skill.slug")
    name_en = serializers.CharField(source="skill.name_en")
    name_bn = serializers.CharField(source="skill.name_bn")
    category_slug = serializers.CharField(source="skill.category.slug")

    class Meta:
        model = WorkerSkill
        fields = ["id", "slug", "name_en", "name_bn", "category_slug", "evidence_verified"]


class AreaBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = ["id", "slug", "name_en", "name_bn"]


class WorkerCardSerializer(serializers.ModelSerializer):
    avg_rating = serializers.FloatField(read_only=True)
    is_new = serializers.BooleanField(read_only=True)
    skills = WorkerSkillSerializer(source="skill_links", many=True, read_only=True)
    service_areas = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()

    class Meta:
        model = WorkerProfile
        fields = [
            "id",
            "display_name",
            "photo",
            "years_experience",
            "availability_status",
            "identity_verified",
            "trust_score",
            "verified_jobs_count",
            "completed_jobs_count",
            "avg_rating",
            "review_count",
            "is_new",
            "categories",
            "skills",
            "service_areas",
        ]

    def get_service_areas(self, profile) -> list[dict]:
        return AreaBriefSerializer([link.area for link in profile.area_links.all()], many=True).data

    def get_categories(self, profile) -> list[dict]:
        seen = {}
        for link in profile.skill_links.all():
            category = link.skill.category
            seen.setdefault(
                category.slug,
                {
                    "slug": category.slug,
                    "name_en": category.name_en,
                    "name_bn": category.name_bn,
                    "icon": category.icon,
                },
            )
        return list(seen.values())


class WorkerPublicSerializer(WorkerCardSerializer):
    member_since = serializers.DateTimeField(source="user.date_joined", read_only=True)
    trust = serializers.SerializerMethodField()

    class Meta(WorkerCardSerializer.Meta):
        fields = [*WorkerCardSerializer.Meta.fields, "bio", "member_since", "trust"]

    def get_trust(self, profile) -> dict:
        return {"score": profile.trust_score, "breakdown": []}


class MyWorkerProfileSerializer(WorkerPublicSerializer):
    completeness = serializers.SerializerMethodField()
    is_setup_complete = serializers.SerializerMethodField()

    class Meta(WorkerPublicSerializer.Meta):
        fields = [*WorkerPublicSerializer.Meta.fields, "completeness", "is_setup_complete"]
        read_only_fields = [
            field
            for field in fields
            if field not in ("display_name", "bio", "years_experience", "availability_status")
        ]
        extra_kwargs = {"years_experience": {"max_value": 60}}

    def get_completeness(self, profile) -> dict:
        return services.completeness(profile)

    def get_is_setup_complete(self, profile) -> bool:
        return services.is_setup_complete(profile)


class SkillIdsSerializer(serializers.Serializer):
    skills = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


class AreaIdsSerializer(serializers.Serializer):
    areas = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)


class PhotoSerializer(serializers.Serializer):
    photo = serializers.ImageField()
