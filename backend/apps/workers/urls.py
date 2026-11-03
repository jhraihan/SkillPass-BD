from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "workers"

router = SimpleRouter()
router.register("workers", views.WorkerViewSet, basename="worker")

urlpatterns = [
    path("workers/me/", views.MyWorkerProfileView.as_view(), name="me"),
    path("workers/me/skills/", views.MySkillsView.as_view(), name="me-skills"),
    path("workers/me/service-areas/", views.MyAreasView.as_view(), name="me-areas"),
    path("workers/me/photo/", views.MyPhotoView.as_view(), name="me-photo"),
    path("workers/me/dashboard/", views.WorkerDashboardView.as_view(), name="me-dashboard"),
    *router.urls,
]
