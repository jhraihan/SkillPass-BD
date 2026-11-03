from django.conf import settings
from rest_framework import serializers

SIGNATURES = (
    (b"\xff\xd8\xff", "image/jpeg", "jpg"),
    (b"\x89PNG\r\n\x1a\n", "image/png", "png"),
    (b"%PDF-", "application/pdf", "pdf"),
)


def sniff(upload):
    position = upload.tell() if hasattr(upload, "tell") else 0
    upload.seek(0)
    head = upload.read(16)
    upload.seek(position)
    for signature, content_type, extension in SIGNATURES:
        if head.startswith(signature):
            return content_type, extension
    return None


def validate_document(upload, field="files"):
    limit = settings.VERIFICATION_MAX_FILE_MB * 1024 * 1024
    if upload.size > limit:
        raise serializers.ValidationError(
            {field: [f"Each file must be {settings.VERIFICATION_MAX_FILE_MB} MB or smaller."]}
        )
    detected = sniff(upload)
    if detected is None:
        raise serializers.ValidationError({field: ["Only JPG, PNG or PDF files are allowed."]})
    return detected
