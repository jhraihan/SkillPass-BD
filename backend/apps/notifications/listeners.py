from apps.accounts.models import User
from apps.bookings import events
from apps.bookings.models import Booking

from .models import Notification
from .services import booking_data, notify, notify_admins

S = Booking.Status
N = Notification.Type

TO_CUSTOMER = {
    S.ACCEPTED: N.BOOKING_ACCEPTED,
    S.DECLINED: N.BOOKING_DECLINED,
    S.EXPIRED: N.BOOKING_EXPIRED,
    S.ON_THE_WAY: N.WORKER_ON_THE_WAY,
    S.IN_PROGRESS: N.JOB_STARTED,
    S.AWAITING_CONFIRMATION: N.CONFIRM_COMPLETION,
}
TO_WORKER = {
    S.PENDING: N.NEW_JOB,
    S.COMPLETED: N.JOB_COMPLETED,
    S.AUTO_CLOSED: N.JOB_AUTO_CLOSED,
}


def _parties(booking):
    customer = booking.customer
    worker_user = booking.worker.user
    return customer, worker_user


@events.on_transition
def notify_booking_change(booking, from_status, to_status, actor):
    if actor is not None and actor.role == User.Role.ADMIN:
        return
    booking = Booking.objects.select_related(
        "customer", "worker__user", "service_request__category", "service_request__area"
    ).get(pk=booking.pk)
    customer, worker_user = _parties(booking)
    worker_name = booking.worker.display_name
    customer_name = customer.full_name.split()[0] if customer.full_name else ""

    if to_status in TO_CUSTOMER:
        notify(customer, TO_CUSTOMER[to_status], booking_data(booking, worker_name))
    elif to_status in TO_WORKER:
        notify(worker_user, TO_WORKER[to_status], booking_data(booking, customer_name))
    elif to_status == S.CANCELLED:
        data = booking_data(booking, reason=booking.cancel_reason)
        for person in (customer, worker_user):
            if actor is None or person.pk != actor.pk:
                notify(person, N.BOOKING_CANCELLED, data)
    elif to_status == S.DISPUTED:
        data = booking_data(booking, reason=booking.dispute_reason)
        for person in (customer, worker_user):
            if actor is None or person.pk != actor.pk:
                notify(person, N.BOOKING_DISPUTED, data)
        notify_admins(N.BOOKING_DISPUTED, data)
