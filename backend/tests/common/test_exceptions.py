from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

factory = APIRequestFactory()


class _NameSerializer(serializers.Serializer):
    name = serializers.CharField()


class _ValidatingView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        _NameSerializer(data=request.data).is_valid(raise_exception=True)


class _MissingView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        raise NotFound("Booking not found.")


def test_validation_errors_use_standard_format():
    response = _ValidatingView.as_view()(factory.post("/", {}, format="json"))

    assert response.status_code == 400
    assert response.data["code"] == "invalid"
    assert "name" in response.data["errors"]


def test_other_errors_use_standard_format():
    response = _MissingView.as_view()(factory.get("/"))

    assert response.status_code == 404
    assert response.data == {"detail": "Booking not found.", "code": "not_found", "errors": {}}
