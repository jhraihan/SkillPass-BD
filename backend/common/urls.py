from django.urls import path

from .views import HealthView, ProcessTimeoutsView, SupportView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("support/", SupportView.as_view(), name="support"),
    path("internal/process-timeouts/", ProcessTimeoutsView.as_view(), name="process-timeouts"),
]
