from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .credentials import validate_credential
from .models import User
from .phone import normalize_bd_phone


def _credential_errors(role, credential, *, phone="", user=None):
    try:
        validate_credential(role, credential, phone=phone, user=user)
    except DjangoValidationError as error:
        return list(error.messages)
    return []


class PhoneField(serializers.CharField):
    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        try:
            return normalize_bd_phone(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages[0], code="invalid_phone") from error


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "email",
            "full_name",
            "role",
            "preferred_language",
            "must_change_credential",
            "date_joined",
        ]
        read_only_fields = fields


class MeUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "email", "preferred_language"]

    def validate_email(self, value):
        return value or None


class RegisterSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[User.Role.CUSTOMER, User.Role.WORKER])
    full_name = serializers.CharField(max_length=150)
    phone = PhoneField(max_length=20)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    preferred_language = serializers.ChoiceField(choices=User.Language.choices, required=False)

    def validate_phone(self, value):
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(
                "An account with this phone number already exists.", code="phone_taken"
            )
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "An account with this email already exists.", code="email_taken"
            )
        return value or None

    def validate(self, attrs):
        draft = User(phone=attrs["phone"], full_name=attrs["full_name"], email=attrs.get("email"))
        errors = _credential_errors(
            attrs["role"], attrs["password"], phone=attrs["phone"], user=draft
        )
        if errors:
            raise serializers.ValidationError({"password": errors})
        return attrs


class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class ChangeCredentialSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        user = self.context["request"].user
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError(
                {"new_password": ["Choose a PIN/password different from the current one."]}
            )
        errors = _credential_errors(user.role, attrs["new_password"], phone=user.phone, user=user)
        if errors:
            raise serializers.ValidationError({"new_password": errors})
        return attrs


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class TokenPairSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class AuthResponseSerializer(TokenPairSerializer):
    user = UserSerializer()
