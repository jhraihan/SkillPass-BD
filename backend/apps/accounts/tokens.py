from django.conf import settings
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.utils import datetime_from_epoch

from .models import User


class SkillPassRefreshToken(RefreshToken):
    def set_exp(self, claim="exp", from_time=None, lifetime=None):
        if lifetime is None and self.payload.get("role") == User.Role.WORKER:
            lifetime = settings.JWT_WORKER_REFRESH_LIFETIME
        super().set_exp(claim=claim, from_time=from_time, lifetime=lifetime)

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)
        token["role"] = user.role
        if user.role == User.Role.WORKER:
            token.set_exp()
            OutstandingToken.objects.filter(jti=token[api_settings.JTI_CLAIM]).update(
                expires_at=datetime_from_epoch(token["exp"])
            )
        return token


class SkillPassTokenRefreshSerializer(TokenRefreshSerializer):
    token_class = SkillPassRefreshToken


def issue_tokens(user):
    refresh = SkillPassRefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def revoke_all_tokens(user):
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
