from .models import AuditLog


def client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    return forwarded.split(",")[0].strip() or request.META.get("REMOTE_ADDR")


def record(actor, action, target, metadata=None, request=None):
    return AuditLog.objects.create(
        actor=actor if actor and actor.is_authenticated else None,
        action=action,
        target_type=target._meta.model_name,
        target_id=str(target.pk),
        metadata=metadata or {},
        ip_address=client_ip(request),
    )
