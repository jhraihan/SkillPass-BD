from django.urls import path
from rest_framework.routers import SimpleRouter

from . import admin_views, views

app_name = "accounts"

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/refresh/", views.RefreshView.as_view(), name="refresh"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.MeView.as_view(), name="me"),
    path("auth/password/change/", views.ChangeCredentialView.as_view(), name="change-password"),
    path("admin/stats/", admin_views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/workers/", admin_views.OnboardWorkerView.as_view(), name="admin-onboard-worker"),
]

router = SimpleRouter()
router.register("admin/users", admin_views.AdminUserViewSet, basename="admin-user")
urlpatterns += router.urls
