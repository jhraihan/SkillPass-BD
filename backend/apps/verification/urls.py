from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "verification"

router = SimpleRouter()
router.register("verification", views.VerificationViewSet, basename="verification")

urlpatterns = [
    path(
        "verification/documents/<int:pk>/",
        views.DocumentView.as_view(),
        name="document",
    ),
    *router.urls,
]
