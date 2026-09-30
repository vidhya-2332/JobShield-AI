from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from api.urls_auth import urlpatterns as auth_urls

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include((auth_urls, "api"), namespace="auth")),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("api.urls")),
]
