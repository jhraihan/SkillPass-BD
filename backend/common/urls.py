from django.urls import path

from .views import HealthView, SupportView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("support/", SupportView.as_view(), name="support"),
]
