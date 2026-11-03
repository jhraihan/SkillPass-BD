import pytest

from apps.catalog.models import Skill
from apps.verification.models import VerificationDocument

from .conftest import PDF, PNG

pytestmark = pytest.mark.django_db
URL = "/api/v1/verification/"


def test_worker_submits_identity_documents(submit, upload, private_root):
    response = submit(files=[upload(), upload("back.png", PNG, "image/png")])

    assert response.status_code == 201, response.json()
    body = response.json()
    assert body["status"] == "PENDING"
    assert [d["content_type"] for d in body["documents"]] == ["image/jpeg", "image/png"]
    stored = [d.file.name for d in VerificationDocument.objects.all()]
    assert all(name.startswith("verification/") and "nid" not in name for name in stored)
    assert all((private_root / name).exists() for name in stored)


def test_type_is_detected_from_content(submit, upload):
    response = submit(files=[upload("scan.jpg", PDF, "image/jpeg")])

    assert response.status_code == 201
    assert response.json()["documents"][0]["content_type"] == "application/pdf"


def test_disguised_file_is_rejected(submit, upload):
    response = submit(files=[upload("photo.jpg", b"MZ\x90\x00" + b"\x00" * 64, "image/jpeg")])

    assert response.status_code == 400
    assert "files" in response.json()["errors"]
    assert not VerificationDocument.objects.exists()


def test_large_file_is_rejected(submit, upload, settings):
    settings.VERIFICATION_MAX_FILE_MB = 1
    big = b"\xff\xd8\xff" + b"\x00" * (1024 * 1024)

    assert submit(files=[upload("big.jpg", big)]).status_code == 400


def test_too_many_files(submit, upload):
    assert submit(files=[upload(f"{n}.jpg") for n in range(6)]).status_code == 400


def test_files_are_required(worker_api):
    response = worker_api.post(URL, {"type": "IDENTITY"}, format="multipart")

    assert response.status_code == 400
    assert "files" in response.json()["errors"]


def test_second_pending_request_conflicts(submit):
    submit()
    response = submit()

    assert response.status_code == 409
    assert response.json()["code"] == "already_pending"


def test_skill_evidence_needs_a_profile_skill(submit):
    not_mine = Skill.objects.get(slug="tap-pipe-repair")
    mine = Skill.objects.get(slug="ac-servicing")

    assert submit(type="SKILL_EVIDENCE").status_code == 400
    assert submit(type="SKILL_EVIDENCE", skill=not_mine.id).status_code == 400
    response = submit(type="SKILL_EVIDENCE", skill=mine.id)
    assert response.status_code == 201
    assert response.json()["skill"]["slug"] == "ac-servicing"


def test_customer_cannot_submit_or_list(submit, customer_api):
    assert submit(client=customer_api).status_code == 403
    assert customer_api.get(URL).status_code == 403


def test_worker_sees_only_own_requests(submit, make_worker, client_for):
    submit()
    other = client_for(make_worker("01822222222", "Other Worker").user)

    assert other.get(URL).json()["count"] == 0
    assert other.get(f"{URL}1/").status_code == 404
