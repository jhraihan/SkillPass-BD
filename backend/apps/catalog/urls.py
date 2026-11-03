from rest_framework.routers import SimpleRouter

from . import views

app_name = "catalog"

router = SimpleRouter()
router.register("categories", views.ServiceCategoryViewSet, basename="category")
router.register("skills", views.SkillViewSet, basename="skill")
router.register("areas", views.AreaViewSet, basename="area")
router.register("districts", views.DistrictViewSet, basename="district")

urlpatterns = router.urls
