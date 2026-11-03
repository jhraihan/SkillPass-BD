from rest_framework import serializers

from .models import Area, District, ServiceCategory, Skill
from .services import unique_slug


class SlugFromNameMixin:
    def _with_slug(self, validated_data):
        if not validated_data.get("slug"):
            name = validated_data.get("name_en") or getattr(self.instance, "name_en", "")
            exclude = self.instance.pk if self.instance else None
            validated_data["slug"] = unique_slug(self.Meta.model, name, exclude_pk=exclude)
        return validated_data

    def create(self, validated_data):
        return super().create(self._with_slug(validated_data))

    def update(self, instance, validated_data):
        if "slug" in validated_data:
            validated_data = self._with_slug(validated_data)
        return super().update(instance, validated_data)


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ["id", "slug", "name_en", "name_bn"]


class AreaSerializer(SlugFromNameMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=60)
    district_detail = DistrictSerializer(source="district", read_only=True)

    class Meta:
        model = Area
        fields = ["id", "slug", "name_en", "name_bn", "district", "district_detail", "is_active"]


class ServiceCategorySerializer(SlugFromNameMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=60)
    skill_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ServiceCategory
        fields = [
            "id",
            "slug",
            "name_en",
            "name_bn",
            "icon",
            "sort_order",
            "is_active",
            "skill_count",
        ]


class SkillSerializer(SlugFromNameMixin, serializers.ModelSerializer):
    slug = serializers.SlugField(required=False, allow_blank=True, max_length=60)
    category_slug = serializers.SlugRelatedField(
        source="category", slug_field="slug", read_only=True
    )

    class Meta:
        model = Skill
        fields = [
            "id",
            "slug",
            "name_en",
            "name_bn",
            "category",
            "category_slug",
            "sort_order",
            "is_active",
        ]
