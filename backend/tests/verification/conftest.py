import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.accounts.models import User

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
PDF = b"%PDF-1.4\n" + b"\x00" * 64


@pytest.fixture(autouse=True)
def private_root(settings, tmp_path):
    settings.PRIVATE_MEDIA_ROOT = tmp_path / "private"
    settings.MEDIA_ROOT = tmp_path / "public"
    return settings.PRIVATE_MEDIA_ROOT


@pytest.fixture
def upload():
    def _upload(name="nid.jpg", content=JPEG, content_type="image/jpeg"):
        return SimpleUploadedFile(name, content, content_type=content_type)

    return _upload


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        phone="01912345678", password="x", full_name="Admin One", role=User.Role.ADMIN
    )


@pytest.fixture
def admin_api(client_for, admin_user):
    return client_for(admin_user)


@pytest.fixture
def submit(worker_api, upload):
    def _submit(client=None, type="IDENTITY", files=None, **extra):
        data = {"type": type, "files": files or [upload()], **extra}
        return (client or worker_api).post("/api/v1/verification/", data, format="multipart")

    return _submit
