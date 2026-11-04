from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="django-insecure-dev-only-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
]

LOCAL_APPS = [
    "common",
    "apps.accounts",
    "apps.catalog",
    "apps.workers",
    "apps.bookings",
    "apps.reviews",
    "apps.verification",
    "apps.trust",
    "apps.reports",
    "apps.notifications",
    "apps.audit",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": env.db("DATABASE_URL")}
DATABASES["default"]["ATOMIC_REQUESTS"] = False
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en"
LANGUAGES = [("en", "English"), ("bn", "বাংলা")]
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = env.path("MEDIA_ROOT", default=BASE_DIR / "media")
PRIVATE_MEDIA_ROOT = env.path("PRIVATE_MEDIA_ROOT", default=BASE_DIR / "private_media")
SERVE_MEDIA = env.bool("SERVE_MEDIA", default=False)
CRON_TOKEN = env("CRON_TOKEN", default="")

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"])

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.accounts.authentication.SkillPassJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "common.exceptions.custom_exception_handler",
    "DEFAULT_THROTTLE_RATES": {
        "anon": "60/min",
        "user": "300/min",
        "auth": "5/min",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("JWT_ACCESS_MINUTES", default=15)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("JWT_REFRESH_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_AUTHENTICATION_RULE": "apps.accounts.authentication.user_can_authenticate",
    "CHECK_REVOKE_TOKEN": True,
}
JWT_WORKER_REFRESH_LIFETIME = timedelta(days=env.int("JWT_WORKER_REFRESH_DAYS", default=30))

BOOKING_RESPONSE_TIMEOUT = timedelta(hours=24)
BOOKING_CONFIRMATION_TIMEOUT = timedelta(hours=72)
MATCHING_WEIGHTS = {
    "skill": 30,
    "trust": 30,
    "availability": 15,
    "experience": 15,
    "responsiveness": 10,
}
MATCHING_LIMIT = 20
TRUST_WEIGHTS = {
    "completion": 25,
    "rating": 20,
    "verified_jobs": 15,
    "cancellation": 15,
    "response": 10,
    "identity": 10,
    "experience": 5,
}
REVIEW_WINDOW_DAYS = 14

VERIFICATION_MAX_FILE_MB = 5
VERIFICATION_MAX_FILES = 5

SUPPORT_PHONE = env("SUPPORT_PHONE", default="+8801700000000")
SUPPORT_WHATSAPP = env("SUPPORT_WHATSAPP", default="8801700000000")
SUPPORT_HOURS = env("SUPPORT_HOURS", default="9:00-21:00")

SPECTACULAR_SETTINGS = {
    "TITLE": "SkillPass BD API",
    "DESCRIPTION": (
        "Digital professional identity and verified work history platform "
        "for informal skilled workers in Bangladesh.\n\n"
        "Authenticate with `POST /api/v1/auth/login/` and send the access token as "
        "`Authorization: Bearer <token>`. Errors always use "
        '`{"detail", "code", "errors"}`. Lists are paginated with `?page=`.'
    ),
    "VERSION": "1.0.0",
    "TAGS": [
        {"name": "auth", "description": "Register, log in with phone + PIN/password, refresh, me."},
        {"name": "categories", "description": "Service categories (public read, admin write)."},
        {"name": "skills", "description": "Skills inside each category."},
        {"name": "areas", "description": "Service areas and districts."},
        {"name": "workers", "description": "Worker search, public profiles, own profile, reviews."},
        {"name": "service-requests", "description": "Customer job requests and matching."},
        {"name": "bookings", "description": "Booking lifecycle: accept, start, complete, confirm."},
        {"name": "reviews", "description": "Structured reviews for finished jobs."},
        {"name": "verification", "description": "Identity / skill documents and admin decisions."},
        {"name": "reports", "description": "Reports, disputes and their resolution."},
        {"name": "notifications", "description": "In-app notifications and unread count."},
        {"name": "admin", "description": "Admin dashboard stats, users and assisted onboarding."},
        {"name": "support", "description": "Public support contact details."},
        {"name": "health", "description": "Liveness check."},
    ],
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
    "SCHEMA_PATH_PREFIX": r"/api/v1",
    "ENUM_NAME_OVERRIDES": {
        "BookingStatusEnum": "apps.bookings.models.Booking.Status",
        "ServiceRequestStatusEnum": "apps.bookings.models.ServiceRequest.Status",
        "VerificationStatusEnum": "apps.verification.models.Verification.Status",
        "ReportStatusEnum": "apps.reports.models.Report.Status",
        "UserRoleEnum": "apps.accounts.models.User.Role",
        "NotificationTypeEnum": "apps.notifications.models.Notification.Type",
        "VerificationTypeEnum": "apps.verification.models.Verification.Type",
    },
}
