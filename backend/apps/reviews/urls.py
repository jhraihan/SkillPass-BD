from django.urls import path

from . import views

app_name = "reviews"

urlpatterns = [
    path("reviews/", views.ReviewCreateView.as_view(), name="create"),
    path("workers/me/reviews/", views.WorkerReviewsView.as_view(mine=True), name="mine"),
    path(
        "workers/me/work-history/",
        views.WorkHistoryView.as_view(mine=True),
        name="my-work-history",
    ),
    path("workers/<int:worker_id>/reviews/", views.WorkerReviewsView.as_view(), name="worker"),
    path(
        "workers/<int:worker_id>/work-history/",
        views.WorkHistoryView.as_view(),
        name="work-history",
    ),
]
