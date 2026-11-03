from drf_spectacular.contrib.rest_framework_simplejwt import SimpleJWTScheme


class SkillPassJWTScheme(SimpleJWTScheme):
    target_class = "apps.accounts.authentication.SkillPassJWTAuthentication"
    name = "jwtAuth"
