from rest_framework import serializers

from apps.catalog.models import Skill

from .models import Verification, VerificationDocument


class VerificationCreateSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=Verification.Type.choices)
    skill = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), required=False, allow_null=True
    )
    files = serializers.ListField(child=serializers.FileField(), allow_empty=False)


class RejectSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=500, trim_whitespace=True)


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationDocument
        fields = ["id", "original_name", "content_type", "size"]


class VerificationSerializer(serializers.ModelSerializer):
    skill = serializers.SerializerMethodField()
    documents = DocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Verification
        fields = [
            "id",
            "type",
            "skill",
            "status",
            "rejection_reason",
            "created_at",
            "reviewed_at",
            "documents",
        ]

    def get_skill(self, verification) -> dict | None:
        link = verification.worker_skill
        if link is None:
            return (
                {"id": None, "name_en": verification.skill_name}
                if verification.skill_name
                else None
            )
        skill = link.skill
        return {
            "id": skill.id,
            "slug": skill.slug,
            "name_en": skill.name_en,
            "name_bn": skill.name_bn,
        }


class AdminVerificationSerializer(VerificationSerializer):
    worker = serializers.SerializerMethodField()
    reviewed_by = serializers.SerializerMethodField()

    class Meta(VerificationSerializer.Meta):
        fields = [*VerificationSerializer.Meta.fields, "worker", "reviewed_by"]

    def get_worker(self, verification) -> dict:
        worker = verification.worker
        return {
            "id": worker.id,
            "display_name": worker.display_name,
            "full_name": worker.user.full_name,
            "phone": worker.user.phone,
            "photo": worker.photo.url if worker.photo else None,
            "identity_verified": worker.identity_verified,
            "member_since": worker.user.date_joined,
        }

    def get_reviewed_by(self, verification) -> str | None:
        admin = verification.reviewed_by
        return admin.full_name if admin else None
