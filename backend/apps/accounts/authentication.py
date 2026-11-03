from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


def user_can_authenticate(user):
    return bool(user and user.is_active and not user.is_suspended and not user.locked_at)


class SkillPassJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if not user_can_authenticate(user):
            raise AuthenticationFailed("This account cannot sign in.", code="account_inactive")
        return user
