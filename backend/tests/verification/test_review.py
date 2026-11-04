import pytest
from rest_framework.test import APIClient

from apps.audit.models import AppendOnlyError, AuditLog
from apps.catalog.models import Skill
from apps.verification.models import VerificationDocument
from apps.workers.models import WorkerSkill

from .conftest import JPEG

pytestmark = pytest.mark.django_db
URL = "/api/v1/verification/"


@pytest.fixture
def pending(submit):
    response = submit()
    assert response.status_code == 201
    return response.json()


def document_url(pending):
    return f"{URL}documents/{pending['documents'][0]['id']}/"


def test_owner_and_admin_can_read_document(pending, worker_api, admin_api):
    for client in (worker_api, admin_api):
        response = client.get(document_url(pending))
        assert response.status_code == 200
        assert b"".join(response.streaming_content) == JPEG
        assert response["Content-Type"] == "image/jpeg"
        assert response["Cache-Control"] == "private, no-store"


def test_nobody_else_can_read_document(pending, customer_api, make_worker, client_for):
    other_worker = client_for(make_worker("01833333333", "Other").user)

    assert other_worker.get(document_url(pending)).status_code == 404
    assert customer_api.get(document_url(pending)).status_code == 403
    assert APIClient().get(document_url(pending)).status_code == 401


def test_documents_have_no_public_url(pending):
    with pytest.raises(ValueError):
        VerificationDocument.objects.get().file.storage.url("any")


def test_admin_queue_shows_oldest_pending_first(
    pending, admin_api, make_worker, client_for, submit
):
    submit(client=client_for(make_worker("01844444444", "Second").user))

    body = admin_api.get(f"{URL}?status=PENDING").json()

    assert [item["id"] for item in body["results"]] == sorted(r["id"] for r in body["results"])
    assert body["results"][0]["worker"]["display_name"]
    assert "phone" in body["results"][0]["worker"]


def test_approve_identity(pending, admin_api, admin_user, worker):
    response = admin_api.post(f"{URL}{pending['id']}/approve/", REMOTE_ADDR="10.0.0.7")

    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"
    assert response.json()["reviewed_by"] == "Admin One"
    worker.refresh_from_db()
    assert worker.identity_verified is True
    assert worker.trust_history.first().trigger == "identity_verified"
    assert worker.user.notifications.get().type == "VERIFICATION_APPROVED"
    entry = AuditLog.objects.get()
    assert (entry.actor, entry.action, entry.ip_address) == (
        admin_user,
        "verification.approved",
        "10.0.0.7",
    )
    assert entry.target_id == str(pending["id"])


def test_identity_cannot_be_sent_again_after_approval(pending, admin_api, submit):
    admin_api.post(f"{URL}{pending['id']}/approve/")

    response = submit()

    assert response.status_code == 409
    assert response.json()["code"] == "already_verified"


def test_approve_skill_evidence(submit, admin_api, worker):
    skill = Skill.objects.get(slug="ac-servicing")
    created = submit(type="SKILL_EVIDENCE", skill=skill.id).json()

    admin_api.post(f"{URL}{created['id']}/approve/")

    assert WorkerSkill.objects.get(worker=worker, skill=skill).evidence_verified is True


def test_reject_needs_reason_and_allows_resubmit(pending, admin_api, submit, worker_api):
    assert admin_api.post(f"{URL}{pending['id']}/reject/", {}).status_code == 400

    response = admin_api.post(f"{URL}{pending['id']}/reject/", {"reason": "Photo is blurry."})

    assert response.status_code == 200
    assert response.json()["rejection_reason"] == "Photo is blurry."
    assert AuditLog.objects.get().metadata["reason"] == "Photo is blurry."
    assert worker_api.get("/api/v1/notifications/").json()["results"][0]["data"]["reason"] == (
        "Photo is blurry."
    )
    assert worker_api.get(f"{URL}{pending['id']}/").json()["status"] == "REJECTED"
    assert submit().status_code == 201


def test_decision_is_final(pending, admin_api):
    admin_api.post(f"{URL}{pending['id']}/approve/")

    response = admin_api.post(f"{URL}{pending['id']}/reject/", {"reason": "Changed mind"})

    assert response.status_code == 409
    assert response.json()["code"] == "already_decided"


def test_worker_cannot_decide(pending, worker_api):
    assert worker_api.post(f"{URL}{pending['id']}/approve/").status_code == 403


def test_audit_log_is_append_only(pending, admin_api):
    admin_api.post(f"{URL}{pending['id']}/approve/")
    entry = AuditLog.objects.get()

    with pytest.raises(AppendOnlyError):
        entry.save()
    with pytest.raises(AppendOnlyError):
        entry.delete()
