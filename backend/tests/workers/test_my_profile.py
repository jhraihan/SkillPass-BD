from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from apps.accounts.models import User
from apps.catalog.models import Area, Skill
from apps.workers.models import WorkerProfile

pytestmark = pytest.mark.django_db

ME_URL = "/api/v1/workers/me/"


def _image(size=(1600, 1200), name="photo.png"):
    buffer = BytesIO()
    Image.new("RGB", size, color=(20, 134, 109)).save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


def test_registering_a_worker_creates_a_profile(api_client):
    api_client.post(
        "/api/v1/auth/register/",
        {"role": "WORKER", "full_name": "Rahim", "phone": "01812345678", "password": "482915"},
    )

    profile = WorkerProfile.objects.get(user__phone="+8801812345678")
    assert profile.display_name == "Rahim"
    assert profile.availability_status == "OFFLINE"


def test_new_profile_is_not_set_up(worker_api):
    body = worker_api.get(ME_URL).json()

    assert body["is_setup_complete"] is False
    assert body["completeness"]["percent"] == 0
    assert body["completeness"]["next_step"] == "skills"


def test_customer_cannot_use_worker_endpoints(api_client):
    customer = User.objects.create_user(phone="01712345678", password="x", full_name="N")
    api_client.force_authenticate(customer)

    assert api_client.get(ME_URL).status_code == 403


def test_patch_updates_editable_fields_only(worker_api):
    response = worker_api.patch(
        ME_URL,
        {
            "display_name": "Rahim Electric",
            "bio": "AC and wiring expert",
            "years_experience": 9,
            "availability_status": "AVAILABLE",
            "trust_score": 99,
            "identity_verified": True,
        },
    )

    assert response.status_code == 200
    profile = worker_api.profile
    profile.refresh_from_db()
    assert profile.display_name == "Rahim Electric"
    assert profile.years_experience == 9
    assert profile.availability_status == "AVAILABLE"
    assert profile.trust_score != 99
    assert profile.identity_verified is False
    assert profile.trust_history.first().trigger == "profile_updated"


def test_set_skills_and_areas_completes_setup(worker_api):
    skills = list(Skill.objects.filter(category__slug="ac-repair").values_list("id", flat=True))
    areas = list(Area.objects.filter(slug__in=["mirpur", "uttara"]).values_list("id", flat=True))

    worker_api.put(f"{ME_URL}skills/", {"skills": skills}, format="json")
    body = worker_api.put(f"{ME_URL}service-areas/", {"areas": areas}, format="json").json()

    assert len(body["skills"]) == 5
    assert {a["slug"] for a in body["service_areas"]} == {"mirpur", "uttara"}
    assert body["categories"][0]["slug"] == "ac-repair"
    assert body["is_setup_complete"] is True
    assert body["completeness"]["percent"] == 50


def test_replacing_skills_keeps_evidence_flag_of_kept_skills(worker_api):
    fridge = Skill.objects.get(slug="refrigerator-repair")
    gas = Skill.objects.get(slug="ac-gas-refill")
    worker_api.put(f"{ME_URL}skills/", {"skills": [fridge.id, gas.id]}, format="json")
    worker_api.profile.skill_links.filter(skill=fridge).update(evidence_verified=True)

    worker_api.put(f"{ME_URL}skills/", {"skills": [fridge.id]}, format="json")

    links = list(worker_api.profile.skill_links.all())
    assert [(link.skill_id, link.evidence_verified) for link in links] == [(fridge.id, True)]


def test_inactive_skill_is_rejected(worker_api):
    skill = Skill.objects.get(slug="tv-repair")
    skill.is_active = False
    skill.save()

    response = worker_api.put(f"{ME_URL}skills/", {"skills": [skill.id]}, format="json")
    assert response.status_code == 400


def test_photo_upload_is_resized(worker_api, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path

    response = worker_api.post(f"{ME_URL}photo/", {"photo": _image()}, format="multipart")

    assert response.status_code == 200
    profile = worker_api.profile
    profile.refresh_from_db()
    with Image.open(profile.photo.path) as stored:
        assert max(stored.size) == 800
    assert response.json()["completeness"]["percent"] == 20


def test_invalid_photo_is_rejected(worker_api, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    fake = SimpleUploadedFile("x.png", b"not an image", content_type="image/png")

    assert (
        worker_api.post(f"{ME_URL}photo/", {"photo": fake}, format="multipart").status_code == 400
    )


def test_dashboard_shape(worker_api):
    body = worker_api.get(f"{ME_URL}dashboard/").json()

    assert body["profile"]["display_name"] == "Rahim Uddin"
    assert body["pending_requests"] == []
    assert body["today_jobs"] == []
