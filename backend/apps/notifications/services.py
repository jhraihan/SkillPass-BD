from django.contrib.auth import get_user_model

from .messages import render
from .models import Notification

N = Notification.Type


def notify(recipient, notification_type, data=None):
    if recipient is None or not recipient.is_active:
        return None
    data = data or {}
    title, body = render(notification_type, recipient.preferred_language, data)
    return Notification.objects.create(
        recipient=recipient, type=notification_type, title=title, body=body, data=data
    )


def notify_admins(notification_type, data=None):
    User = get_user_model()
    admins = User.objects.filter(role=User.Role.ADMIN, is_active=True, is_suspended=False)
    return [notify(admin, notification_type, data) for admin in admins]


def _brief(item):
    return {"name_en": item.name_en, "name_bn": item.name_bn}


def booking_data(booking, name="", **extra):
    request = booking.service_request
    return {
        "booking_id": booking.pk,
        "category": {**_brief(request.category), "icon": request.category.icon},
        "area": _brief(request.area),
        "name": name,
        **extra,
    }


def unread_count(user):
    return Notification.objects.filter(recipient=user, is_read=False).count()


def mark_read(user, notification_id=None):
    queryset = Notification.objects.filter(recipient=user, is_read=False)
    if notification_id is not None:
        queryset = queryset.filter(pk=notification_id)
    return queryset.update(is_read=True)
