from rest_framework.routers import SimpleRouter

from . import views

app_name = "bookings"

router = SimpleRouter()
router.register("service-requests", views.ServiceRequestViewSet, basename="service-request")
router.register("bookings", views.BookingViewSet, basename="booking")

urlpatterns = router.urls
