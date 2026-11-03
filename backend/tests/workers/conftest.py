import pytest

from apps.accounts.models import User
from apps.catalog.models import Area, Skill
from apps.workers.services import create_worker_profile, set_service_areas, set_skills


@pytest.fixture
def make_worker(db):
    def _make(phone, name, skills=(), areas=(), **profile_fields):
        user = User.objects.create_user(
            phone=phone, password="482915", full_name=name, role=User.Role.WORKER
        )
        profile = create_worker_profile(user)
        if skills:
            set_skills(profile, Skill.objects.filter(slug__in=skills).values_list("id", flat=True))
        if areas:
            set_service_areas(
                profile, Area.objects.filter(slug__in=areas).values_list("id", flat=True)
            )
        for field, value in profile_fields.items():
            setattr(profile, field, value)
        profile.save()
        return profile

    return _make


@pytest.fixture
def worker_api(api_client, make_worker):
    profile = make_worker("01812345678", "Rahim Uddin")
    api_client.force_authenticate(profile.user)
    api_client.profile = profile
    return api_client
