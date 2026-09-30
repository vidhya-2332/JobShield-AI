from django.urls import path
from . import views

urlpatterns = [
    path("profile/", views.profile, name="profile"),
    path("change-password/", views.change_password, name="change_password"),
    path("analyze/", views.analyze_job, name="analyze_job"),
    path("batch-analyze/", views.batch_analyze, name="batch_analyze"),
    path("predictions/", views.list_predictions, name="list_predictions"),
    path("predictions/<int:pk>/", views.get_prediction, name="get_prediction"),
    path("history/", views.list_history, name="list_history"),
    path("dashboard/", views.dashboard_stats, name="dashboard_stats"),
    path("analytics/", views.analytics, name="analytics"),
    path("model-performance/", views.model_performance, name="model_performance"),
]
