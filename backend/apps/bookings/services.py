from django.conf import settings
from django.db import transaction
from django.db.models import Count, F, Q
from django.utils import timezone
from rest_framework import serializers

from apps.workers.models import WorkerProfile
from apps.workers.services import is_setup_complete
from common.permissions import is_admin

from . import events
from .exceptions import ActionNotAllowed, InvalidTransition, RequestNotOpen, WorkerBusy
from .models import Booking, BookingStatusHistory, ServiceRequest

S = Booking.Status
CUSTOMER, WORKER, ADMIN, SYSTEM = "CUSTOMER", "WORKER", "ADMIN", "SYSTEM"

TRANSITIONS = {
    (S.PENDING, S.ACCEPTED): {WORKER},
    (S.PENDING, S.DECLINED): {WORKER},
    (S.PENDING, S.CANCELLED): {CUSTOMER},
    (S.PENDING, S.EXPIRED): {SYSTEM},
    (S.ACCEPTED, S.ON_THE_WAY): {WORKER},
    (S.ACCEPTED, S.CANCELLED): {CUSTOMER, WORKER},
    (S.ON_THE_WAY, S.IN_PROGRESS): {WORKER},
    (S.ON_THE_WAY, S.CANCELLED): {CUSTOMER, WORKER},
    (S.IN_PROGRESS, S.AWAITING_CONFIRMATION): {WORKER},
    (S.IN_PROGRESS, S.DISPUTED): {CUSTOMER, WORKER},
    (S.AWAITING_CONFIRMATION, S.COMPLETED): {CUSTOMER},
    (S.AWAITING_CONFIRMATION, S.DISPUTED): {CUSTOMER},
    (S.AWAITING_CONFIRMATION, S.AUTO_CLOSED): {SYSTEM},
    (S.DISPUTED, S.COMPLETED): {ADMIN},
    (S.DISPUTED, S.CANCELLED): {ADMIN},
}

ACTIONS = {
    "accept": S.ACCEPTED,
    "decline": S.DECLINED,
    "on-the-way": S.ON_THE_WAY,
    "start": S.IN_PROGRESS,
    "mark-complete": S.AWAITING_CONFIRMATION,
    "confirm": S.COMPLETED,
    "cancel": S.CANCELLED,
    "dispute": S.DISPUTED,
}
REASON_REQUIRED = {"cancel", "dispute"}
REOPENING_STATUSES = {S.DECLINED, S.EXPIRED, S.CANCELLED}


def role_of(booking, user):
    if user is None:
        return SYSTEM
    if user.pk == booking.customer_id:
        return CUSTOMER
    if user.pk == booking.worker.user_id:
        return WORKER
    if is_admin(user):
        return ADMIN
    return None


def allowed_actions(booking, user):
    role = role_of(booking, user)
    return [
        action
        for action, target in ACTIONS.items()
        if role in TRANSITIONS.get((booking.status, target), set()) and role != ADMIN
    ]


@transaction.atomic
def transition(booking_id, to_status, actor=None, note=""):
    booking = (
        Booking.objects.select_for_update()
        .select_related("worker", "service_request")
        .get(pk=booking_id)
    )
    from_status = booking.status
    allowed_roles = TRANSITIONS.get((from_status, to_status))
    if allowed_roles is None:
        raise InvalidTransition()
    role = role_of(booking, actor)
    if role not in allowed_roles:
        raise ActionNotAllowed()

    _apply(booking, to_status, actor, note)
    booking.status = to_status
    booking.save()
    BookingStatusHistory.objects.create(
        booking=booking,
        from_status=from_status,
        to_status=to_status,
        actor=actor,
        actor_role=role,
        note=note,
    )
    events.emit(booking, from_status, to_status, actor)
    return booking


def _apply(booking, to_status, actor, note):
    now = timezone.now()
    request = booking.service_request

    if to_status == S.ACCEPTED:
        booking.accepted_at = now
        _set_request_status(request, ServiceRequest.Status.BOOKED)
    elif to_status == S.IN_PROGRESS:
        busy = Booking.objects.filter(worker=booking.worker, status=S.IN_PROGRESS).exists()
        if busy:
            raise WorkerBusy()
        booking.started_at = now
    elif to_status == S.AWAITING_CONFIRMATION:
        booking.work_done_at = now
        booking.completion_notes = note
    elif to_status == S.CANCELLED:
        booking.cancelled_by = actor
        booking.cancel_reason = note
    elif to_status == S.DISPUTED:
        booking.dispute_reason = note
    elif to_status in (S.COMPLETED, S.AUTO_CLOSED):
        booking.closed_at = now
        booking.is_verified = booking.status == S.AWAITING_CONFIRMATION and to_status == S.COMPLETED
        _set_request_status(request, ServiceRequest.Status.CLOSED)
        WorkerProfile.objects.filter(pk=booking.worker_id).update(
            completed_jobs_count=F("completed_jobs_count") + 1,
            verified_jobs_count=F("verified_jobs_count") + int(booking.is_verified),
        )

    if to_status in REOPENING_STATUSES:
        booking.closed_at = now
        if request.status in (ServiceRequest.Status.OPEN, ServiceRequest.Status.BOOKED):
            _set_request_status(request, ServiceRequest.Status.OPEN)


def _set_request_status(request, status):
    request.status = status
    request.save(update_fields=["status", "updated_at"])


@transaction.atomic
def create_service_request(customer, *, skills=(), **fields):
    request = ServiceRequest.objects.create(customer=customer, **fields)
    request.skills.set(skills)
    return request


@transaction.atomic
def cancel_service_request(request, actor):
    if request.status not in (ServiceRequest.Status.OPEN, ServiceRequest.Status.BOOKED):
        raise RequestNotOpen()
    for booking in request.bookings.filter(status__in=Booking.ACTIVE_STATUSES):
        if (booking.status, S.CANCELLED) not in TRANSITIONS:
            raise RequestNotOpen()
        transition(booking.pk, S.CANCELLED, actor, note="Request cancelled by customer.")
    _set_request_status(request, ServiceRequest.Status.CANCELLED)
    return request


def bookable_workers(request):
    return WorkerProfile.objects.filter(
        user__is_active=True,
        user__is_suspended=False,
        skills__category=request.category,
        skills__is_active=True,
        service_areas=request.area,
    ).exclude(availability_status=WorkerProfile.Availability.OFFLINE)


@transaction.atomic
def create_booking(request, worker):
    request = ServiceRequest.objects.select_for_update().get(pk=request.pk)
    if request.status != ServiceRequest.Status.OPEN:
        raise RequestNotOpen()
    if request.bookings.filter(status__in=Booking.ACTIVE_STATUSES).exists():
        raise RequestNotOpen()
    eligible = bookable_workers(request).filter(pk=worker.pk).exists()
    if not eligible or not is_setup_complete(worker) or worker.user_id == request.customer_id:
        raise serializers.ValidationError(
            {"worker": ["This worker is not available for this request."]}
        )
    booking = Booking.objects.create(
        service_request=request, customer=request.customer, worker=worker
    )
    BookingStatusHistory.objects.create(
        booking=booking, to_status=S.PENDING, actor=request.customer, actor_role=CUSTOMER
    )
    events.emit(booking, "", S.PENDING, request.customer)
    return booking


def _reason(code, **params):
    return {"code": code, "params": params}


def match_workers(request, limit=None):
    weights = settings.MATCHING_WEIGHTS
    wanted_skills = set(request.skills.values_list("id", flat=True))
    already_asked = request.bookings.values_list("worker_id", flat=True)
    category_jobs = Count(
        "bookings",
        filter=Q(
            bookings__status=S.COMPLETED,
            bookings__service_request__category=request.category,
        ),
        distinct=True,
    )
    candidates = (
        bookable_workers(request)
        .exclude(pk__in=already_asked)
        .exclude(user=request.customer)
        .annotate(category_jobs=category_jobs)
        .prefetch_related("skills")
        .distinct()
    )

    matches = []
    for worker in candidates:
        worker_skills = {skill.id for skill in worker.skills.all()}
        exact = bool(wanted_skills & worker_skills)
        available = worker.availability_status == WorkerProfile.Availability.AVAILABLE
        reasons = [_reason("serves_area", area=request.area.name_en, area_bn=request.area.name_bn)]
        reasons.append(_reason("skill_match" if exact else "category_match"))
        if available:
            reasons.append(_reason("available_now"))
        if worker.trust_score >= 75:
            reasons.append(_reason("high_trust", score=worker.trust_score))
        if worker.category_jobs:
            reasons.append(_reason("category_experience", count=worker.category_jobs))

        score = (
            weights["skill"] * (1.0 if exact or not wanted_skills else 0.6)
            + weights["trust"] * worker.trust_score / 100
            + weights["availability"] * (1.0 if available else 0.4)
            + weights["experience"] * min(worker.category_jobs / 10, 1)
            + weights["responsiveness"] * 0.7
        )
        matches.append((round(score, 1), worker, reasons))

    matches.sort(key=lambda match: (-match[0], -match[1].verified_jobs_count, match[1].pk))
    return matches[: limit or settings.MATCHING_LIMIT]


def process_timeouts(now=None):
    now = now or timezone.now()
    expired = Booking.objects.filter(
        status=S.PENDING, created_at__lte=now - settings.BOOKING_RESPONSE_TIMEOUT
    )
    auto_closed = Booking.objects.filter(
        status=S.AWAITING_CONFIRMATION,
        work_done_at__lte=now - settings.BOOKING_CONFIRMATION_TIMEOUT,
    )
    counts = {"expired": 0, "auto_closed": 0}
    for key, queryset, target in (
        ("expired", expired, S.EXPIRED),
        ("auto_closed", auto_closed, S.AUTO_CLOSED),
    ):
        for booking_id in list(queryset.values_list("pk", flat=True)):
            try:
                transition(booking_id, target, actor=None)
            except InvalidTransition:
                continue
            counts[key] += 1
    return counts
