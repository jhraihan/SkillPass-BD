from rest_framework.routers import SimpleRouter

from . import views

app_name = "reports"

router = SimpleRouter()
router.register("reports", views.ReportViewSet, basename="report")

urlpatterns = router.urls
