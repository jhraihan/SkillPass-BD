from io import BytesIO

from django.core.files.base import ContentFile
from django.db import transaction
from PIL import Image, ImageOps
from rest_framework import serializers

from apps.catalog.models import Area, Skill

from .models import WorkerProfile, WorkerServiceArea, WorkerSkill

PHOTO_MAX_SIZE = 800
PHOTO_MAX_BYTES = 5 * 1024 * 1024

COMPLETENESS_STEPS = [
    ("skills", 25, lambda p: p.skill_links.exists()),
    ("areas", 25, lambda p: p.area_links.exists()),
    ("photo", 20, lambda p: bool(p.photo)),
    ("experience", 10, lambda p: p.years_experience > 0),
    ("bio", 10, lambda p: bool(p.bio.strip())),
    ("identity", 10, lambda p: p.identity_verified),
]


def create_worker_profile(user):
    return WorkerProfile.objects.create(user=user, display_name=user.full_name)


def profile_for(user):
    profile, _ = WorkerProfile.objects.get_or_create(
        user=user, defaults={"display_name": user.full_name}
    )
    return profile


def is_setup_complete(profile):
    return profile.skill_links.exists() and profile.area_links.exists()


def completeness(profile):
    missing = [key for key, _, done in COMPLETENESS_STEPS if not done(profile)]
    percent = sum(weight for key, weight, _ in COMPLETENESS_STEPS if key not in missing)
    return {"percent": percent, "missing": missing, "next_step": missing[0] if missing else None}


@transaction.atomic
def set_skills(profile, skill_ids):
    skills = list(Skill.objects.filter(id__in=set(skill_ids), is_active=True))
    if len(skills) != len(set(skill_ids)):
        raise serializers.ValidationError({"skills": ["One or more skills are not available."]})
    kept = WorkerSkill.objects.filter(worker=profile, skill__in=skills)
    kept_ids = set(kept.values_list("skill_id", flat=True))
    WorkerSkill.objects.filter(worker=profile).exclude(skill__in=skills).delete()
    WorkerSkill.objects.bulk_create(
        WorkerSkill(worker=profile, skill=skill) for skill in skills if skill.id not in kept_ids
    )


@transaction.atomic
def set_service_areas(profile, area_ids):
    areas = list(Area.objects.filter(id__in=set(area_ids), is_active=True))
    if len(areas) != len(set(area_ids)):
        raise serializers.ValidationError({"areas": ["One or more areas are not available."]})
    WorkerServiceArea.objects.filter(worker=profile).delete()
    WorkerServiceArea.objects.bulk_create(WorkerServiceArea(worker=profile, area=a) for a in areas)


def _shrink(upload):
    try:
        image = ImageOps.exif_transpose(Image.open(upload))
    except Exception as error:
        raise serializers.ValidationError({"photo": ["Upload a valid image."]}) from error
    image = image.convert("RGB")
    image.thumbnail((PHOTO_MAX_SIZE, PHOTO_MAX_SIZE))
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=85, optimize=True)
    return ContentFile(buffer.getvalue())


def set_photo(profile, upload):
    if upload.size > PHOTO_MAX_BYTES:
        raise serializers.ValidationError({"photo": ["The photo must be 5 MB or smaller."]})
    content = _shrink(upload)
    if profile.photo:
        profile.photo.delete(save=False)
    profile.photo.save(f"worker-{profile.pk}.jpg", content, save=True)


def remove_photo(profile):
    if profile.photo:
        profile.photo.delete(save=True)
