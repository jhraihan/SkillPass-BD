from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from apps.audit.services import record
from apps.trust.services import recalculate
from apps.workers.models import WorkerProfile, WorkerSkill
from common.exceptions import Conflict
from common.uploads import validate_document

from .models import Verification, VerificationDocument

T = Verification.Type
S = Verification.Status


def _resolve_skill(worker, verification_type, skill):
    if verification_type == T.IDENTITY:
        return None
    if skill is None:
        raise serializers.ValidationError({"skill": ["Choose the skill this evidence is for."]})
    link = WorkerSkill.objects.filter(worker=worker, skill=skill).first()
    if link is None:
        raise serializers.ValidationError({"skill": ["Add this skill to your profile first."]})
    return link


def _check_can_submit(worker, verification_type, link):
    if verification_type == T.IDENTITY and worker.identity_verified:
        raise Conflict("Your identity is already verified.", code="already_verified")
    if link is not None and link.evidence_verified:
        raise Conflict("This skill is already checked.", code="already_verified")
    pending = Verification.objects.filter(
        worker=worker, type=verification_type, worker_skill=link, status=S.PENDING
    )
    if pending.exists():
        raise Conflict("You already sent this. Please wait for the review.", code="already_pending")


def _validate_files(files):
    if not files:
        raise serializers.ValidationError({"files": ["Add at least one photo or PDF."]})
    if len(files) > settings.VERIFICATION_MAX_FILES:
        raise serializers.ValidationError(
            {"files": [f"Send at most {settings.VERIFICATION_MAX_FILES} files."]}
        )
    return [(upload, *validate_document(upload)) for upload in files]


@transaction.atomic
def submit(worker, verification_type, files, skill=None):
    link = _resolve_skill(worker, verification_type, skill)
    _check_can_submit(worker, verification_type, link)
    checked = _validate_files(files)
    verification = Verification.objects.create(
        worker=worker,
        type=verification_type,
        worker_skill=link,
        skill_name=link.skill.name_en if link else "",
    )
    for upload, content_type, extension in checked:
        document = VerificationDocument(
            verification=verification,
            original_name=upload.name[:255],
            content_type=content_type,
            size=upload.size,
        )
        document.file.save(f"upload.{extension}", upload, save=False)
        document.save()
    return verification


def _lock_pending(verification):
    locked = Verification.objects.select_for_update().get(pk=verification.pk)
    if locked.status != S.PENDING:
        raise Conflict("This request was already decided.", code="already_decided")
    return locked


def _decide(verification, admin, status, reason=""):
    verification.status = status
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.rejection_reason = reason
    verification.save(
        update_fields=["status", "reviewed_by", "reviewed_at", "rejection_reason", "updated_at"]
    )


@transaction.atomic
def approve(verification, admin, request=None):
    verification = _lock_pending(verification)
    if verification.type == T.SKILL_EVIDENCE and verification.worker_skill is None:
        raise Conflict("The worker removed this skill.", code="skill_removed")
    _decide(verification, admin, S.APPROVED)
    if verification.type == T.IDENTITY:
        WorkerProfile.objects.filter(pk=verification.worker_id).update(identity_verified=True)
        recalculate(verification.worker, trigger="identity_verified")
    else:
        WorkerSkill.objects.filter(pk=verification.worker_skill_id).update(evidence_verified=True)
    record(admin, "verification.approved", verification, _audit_data(verification), request)
    return verification


@transaction.atomic
def reject(verification, admin, reason, request=None):
    verification = _lock_pending(verification)
    _decide(verification, admin, S.REJECTED, reason)
    data = {**_audit_data(verification), "reason": reason}
    record(admin, "verification.rejected", verification, data, request)
    return verification


def _audit_data(verification):
    return {
        "worker_id": verification.worker_id,
        "type": verification.type,
        "skill": verification.skill_name,
    }
