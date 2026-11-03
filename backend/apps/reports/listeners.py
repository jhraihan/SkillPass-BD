from apps.bookings import events
from apps.bookings.models import Booking

from .services import open_dispute_report


@events.on_transition
def report_disputes(booking, from_status, to_status, actor):
    if to_status == Booking.Status.DISPUTED:
        open_dispute_report(booking, actor, booking.dispute_reason)
