from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import NotFound

from apps.accounts.admin_services import suspend_user
from apps.audit.services import record
from apps.bookings.models import Booking
from apps.bookings.services import transition
from apps.reviews.models import Review
from apps.trust.services import recalculate
from apps.workers.models import WorkerProfile
from common.exceptions import Conflict

from .models import Report

T = Report.Target
R = Report.Status
OPEN_STATUSES = (R.OPEN, R.IN_REVIEW)
BOOKING_OUTCOMES = (Booking.Status.COMPLETED, Booking.Status.CANCELLED)


def load_target(target_type, target_id):
    model = {T.BOOKING: Booking, T.WORKER: WorkerProfile, T.REVIEW: Review}[target_type]
    target = model.objects.filter(pk=target_id).first()
    if target is None:
        raise NotFound("What you are reporting could not be found.")
    return target


def _check_reporter(reporter, target_type, target):
    if target_type == T.BOOKING and reporter.pk not in (target.customer_id, target.worker.user_id):
        raise NotFound("What you are reporting could not be found.")
    own = {
        T.WORKER: lambda: target.user_id == reporter.pk,
        T.REVIEW: lambda: target.customer_id == reporter.pk,
        T.BOOKING: lambda: False,
    }[target_type]()
    if own:
        raise serializers.ValidationError({"target_id": ["You cannot report yourself."]})


def create_report(reporter, target_type, target_id, reason, description="", is_dispute=False):
    target = load_target(target_type, target_id)
    _check_reporter(reporter, target_type, target)
    duplicate = Report.objects.filter(
        reporter=reporter,
        target_type=target_type,
        target_id=target.pk,
        status__in=OPEN_STATUSES,
    )
    if duplicate.exists():
        raise Conflict(
            "You already reported this. Our team is looking at it.", code="already_reported"
        )
    return Report.objects.create(
        reporter=reporter,
        target_type=target_type,
        target_id=target.pk,
        reason=reason,
        description=description,
        is_dispute=is_dispute,
    )


def open_dispute_report(booking, actor, note):
    exists = Report.objects.filter(
        target_type=T.BOOKING, target_id=booking.pk, is_dispute=True, status__in=OPEN_STATUSES
    ).exists()
    if exists or actor is None:
        return None
    return Report.objects.create(
        reporter=actor,
        target_type=T.BOOKING,
        target_id=booking.pk,
        reason=Report.Reason.POOR_WORK if actor.pk == booking.customer_id else Report.Reason.OTHER,
        description=note,
        is_dispute=True,
    )


def _lock_open(report):
    locked = Report.objects.select_for_update().get(pk=report.pk)
    if locked.status not in OPEN_STATUSES:
        raise Conflict("This report is already closed.", code="already_decided")
    return locked


@transaction.atomic
def take(report, admin, request=None):
    report = _lock_open(report)
    report.status = R.IN_REVIEW
    report.assigned_admin = admin
    report.save(update_fields=["status", "assigned_admin", "updated_at"])
    record(admin, "report.taken", report, {}, request)
    return report


def subject_user(report, target, fault):
    if report.target_type == T.WORKER:
        return target.user
    if report.target_type == T.REVIEW:
        return target.customer
    return {Report.Fault.WORKER: target.worker.user, Report.Fault.CUSTOMER: target.customer}.get(
        fault
    )


def _validate_resolution(report, target, data):
    errors = {}
    outcome = data.get("booking_outcome")
    disputed = report.target_type == T.BOOKING and target.status == Booking.Status.DISPUTED
    if data["status"] == R.RESOLVED and disputed and not outcome:
        errors["booking_outcome"] = ["Choose how this job ends."]
    if outcome and not disputed:
        errors["booking_outcome"] = ["This job is not in dispute."]
    if outcome and not data.get("fault"):
        errors["fault"] = ["Choose who was at fault."]
    if data.get("review_action") and report.target_type != T.REVIEW:
        errors["review_action"] = ["Only review reports can change a review."]
    if data.get("suspend") and subject_user(report, target, data.get("fault")) is None:
        errors["suspend"] = ["Choose who was at fault before suspending."]
    if data["status"] == R.DISMISSED and (
        outcome or data.get("review_action") or data.get("suspend")
    ):
        errors["status"] = ["A dismissed report cannot take actions."]
    if errors:
        raise serializers.ValidationError(errors)


def _apply_booking_outcome(target, outcome, fault, admin, note):
    transition(target.pk, outcome, actor=admin, note=note)
    if outcome == Booking.Status.CANCELLED and fault == Report.Fault.WORKER:
        Booking.objects.filter(pk=target.pk).update(worker_at_fault=True)


def _apply_review_action(review, action):
    field = {"HIDE": "is_hidden", "INVALIDATE": "is_invalid"}[action]
    setattr(review, field, True)
    review.save(update_fields=[field, "updated_at"])
    recalculate(review.worker, trigger="review_moderated")


@transaction.atomic
def resolve(report, admin, data, request=None):
    report = _lock_open(report)
    target = load_target(report.target_type, report.target_id)
    _validate_resolution(report, target, data)
    note = data["resolution_note"]
    if data.get("booking_outcome"):
        _apply_booking_outcome(target, data["booking_outcome"], data["fault"], admin, note)
    if data.get("review_action"):
        _apply_review_action(target, data["review_action"])
    if data.get("suspend"):
        suspend_user(subject_user(report, target, data.get("fault")), admin, note, request)
    report.status = data["status"]
    report.resolution_note = note
    report.fault = data.get("fault") or ""
    report.assigned_admin = report.assigned_admin or admin
    report.resolved_at = timezone.now()
    report.save()
    metadata = {
        key: data.get(key)
        for key in ("status", "fault", "booking_outcome", "review_action", "suspend")
        if data.get(key)
    }
    record(admin, f"report.{data['status'].lower()}", report, metadata, request)
    return report
