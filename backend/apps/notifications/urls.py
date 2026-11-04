from rest_framework.routers import SimpleRouter

from . import views

app_name = "notifications"

router = SimpleRouter()
router.register("notifications", views.NotificationViewSet, basename="notification")

urlpatterns = router.urls
