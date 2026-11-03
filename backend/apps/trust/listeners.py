from apps.bookings import events
from apps.bookings.models import Booking

from .services import recalculate

S = Booking.Status
TRUST_RELEVANT = {
    S.ACCEPTED,
    S.DECLINED,
    S.EXPIRED,
    S.CANCELLED,
    S.COMPLETED,
    S.AUTO_CLOSED,
}


@events.on_transition
def recalculate_after_booking_change(booking, from_status, to_status, actor):
    if to_status in TRUST_RELEVANT:
        recalculate(booking.worker, trigger=f"booking_{to_status.lower()}")
