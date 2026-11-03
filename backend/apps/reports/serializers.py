from rest_framework import serializers
from rest_framework.exceptions import NotFound

from apps.bookings.models import Booking
from apps.bookings.serializers import HistorySerializer
from apps.reviews.serializers import ReviewSerializer

from .models import Report
from .services import BOOKING_OUTCOMES, load_target

T = Report.Target


class ReportCreateSerializer(serializers.Serializer):
    target_type = serializers.ChoiceField(choices=Report.Target.choices)
    target_id = serializers.IntegerField(min_value=1)
    reason = serializers.ChoiceField(choices=Report.Reason.choices)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, default=""
    )


class ResolveSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=[Report.Status.RESOLVED, Report.Status.DISMISSED], default=Report.Status.RESOLVED
    )
    resolution_note = serializers.CharField(max_length=1000)
    fault = serializers.ChoiceField(choices=Report.Fault.choices, required=False, allow_blank=True)
    booking_outcome = serializers.ChoiceField(
        choices=BOOKING_OUTCOMES, required=False, allow_blank=True
    )
    review_action = serializers.ChoiceField(
        choices=["HIDE", "INVALIDATE"], required=False, allow_blank=True
    )
    suspend = serializers.BooleanField(default=False)


def _person(user):
    return {"id": user.id, "name": user.full_name, "phone": user.phone, "role": user.role}


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "target_type",
            "target_id",
            "reason",
            "description",
            "is_dispute",
            "status",
            "resolution_note",
            "fault",
            "created_at",
            "resolved_at",
        ]


class AdminReportSerializer(ReportSerializer):
    reporter = serializers.SerializerMethodField()
    assigned_admin = serializers.SerializerMethodField()
    target = serializers.SerializerMethodField()

    class Meta(ReportSerializer.Meta):
        fields = [*ReportSerializer.Meta.fields, "reporter", "assigned_admin", "target"]

    def get_reporter(self, report) -> dict:
        return _person(report.reporter)

    def get_assigned_admin(self, report) -> str | None:
        return report.assigned_admin.full_name if report.assigned_admin else None

    def get_target(self, report) -> dict | None:
        try:
            target = load_target(report.target_type, report.target_id)
        except NotFound:
            return None
        describe = {T.BOOKING: self._booking, T.WORKER: self._worker, T.REVIEW: self._review}
        return describe[report.target_type](target)

    def _worker(self, worker) -> dict:
        user = worker.user
        return {
            "id": worker.id,
            "display_name": worker.display_name,
            "user": {**_person(user), "is_suspended": user.is_suspended},
            "trust_score": worker.trust_score,
        }

    def _booking(self, booking: Booking) -> dict:
        request = booking.service_request
        return {
            "id": booking.id,
            "status": booking.status,
            "category": request.category.name_en,
            "category_bn": request.category.name_bn,
            "description": request.description,
            "dispute_reason": booking.dispute_reason,
            "completion_notes": booking.completion_notes,
            "customer": {
                **_person(booking.customer),
                "is_suspended": booking.customer.is_suspended,
            },
            "worker": self._worker(booking.worker),
            "history": HistorySerializer(booking.history.all(), many=True).data,
        }

    def _review(self, review) -> dict:
        return {
            **ReviewSerializer(review).data,
            "is_hidden": review.is_hidden,
            "is_invalid": review.is_invalid,
            "author": {**_person(review.customer), "is_suspended": review.customer.is_suspended},
            "worker": self._worker(review.worker),
        }
