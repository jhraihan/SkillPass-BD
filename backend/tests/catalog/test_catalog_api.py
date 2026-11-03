import pytest

from apps.accounts.models import User
from apps.catalog.models import Area, ServiceCategory, Skill

pytestmark = pytest.mark.django_db


@pytest.fixture
def admin_api(api_client):
    admin = User.objects.create_superuser(
        phone="01912345678", password="Admin-pass-2026", full_name="Karim"
    )
    api_client.force_authenticate(admin)
    return api_client


@pytest.fixture
def customer_api(api_client):
    customer = User.objects.create_user(phone="01712345678", password="x", full_name="Nusrat")
    api_client.force_authenticate(customer)
    return api_client


class TestSeedData:
    def test_seeded_catalog_is_available(self, api_client):
        assert len(api_client.get("/api/v1/categories/").json()) == 8
        assert len(api_client.get("/api/v1/skills/").json()) == 40
        assert len(api_client.get("/api/v1/areas/").json()) == 20

    def test_names_exist_in_both_languages(self, api_client):
        category = api_client.get("/api/v1/categories/").json()[0]

        assert category["name_en"] == "AC Repair"
        assert category["name_bn"] == "এসি মেরামত"
        assert category["skill_count"] == 5


class TestPublicReads:
    def test_skills_filter_by_category(self, api_client):
        skills = api_client.get("/api/v1/skills/?category=plumbing").json()

        assert len(skills) == 5
        assert {skill["category_slug"] for skill in skills} == {"plumbing"}

    def test_areas_filter_by_district(self, api_client):
        assert len(api_client.get("/api/v1/areas/?district=dhaka-district").json()) == 20
        assert api_client.get("/api/v1/areas/?district=nowhere").json() == []

    def test_inactive_items_are_hidden_from_public(self, api_client):
        Skill.objects.filter(slug="tv-repair").update(is_active=False)
        ServiceCategory.objects.filter(slug="painting").update(is_active=False)

        slugs = {s["slug"] for s in api_client.get("/api/v1/skills/").json()}
        categories = {c["slug"] for c in api_client.get("/api/v1/categories/").json()}
        assert "tv-repair" not in slugs
        assert "interior-painting" not in slugs
        assert "painting" not in categories

    def test_include_inactive_is_ignored_for_non_admins(self, api_client):
        ServiceCategory.objects.filter(slug="painting").update(is_active=False)

        response = api_client.get("/api/v1/categories/?include_inactive=true")
        assert len(response.json()) == 7


class TestAdminWrites:
    def test_admin_sees_inactive_items(self, admin_api):
        ServiceCategory.objects.filter(slug="painting").update(is_active=False)

        assert len(admin_api.get("/api/v1/categories/?include_inactive=true").json()) == 8

    def test_admin_creates_category_with_generated_slug(self, admin_api):
        response = admin_api.post(
            "/api/v1/categories/", {"name_en": "Gardening", "name_bn": "বাগান করা", "icon": "leaf"}
        )

        assert response.status_code == 201
        assert response.json()["slug"] == "gardening"

    def test_duplicate_names_get_unique_slugs(self, admin_api):
        payload = {"name_en": "Plumbing", "name_bn": "প্লাম্বিং ২"}

        assert admin_api.post("/api/v1/categories/", payload).json()["slug"] == "plumbing-2"

    def test_admin_creates_skill_and_area(self, admin_api):
        category = ServiceCategory.objects.get(slug="electrical")
        district_id = Area.objects.first().district_id

        skill = admin_api.post(
            "/api/v1/skills/",
            {"name_en": "Generator repair", "name_bn": "জেনারেটর মেরামত", "category": category.id},
        )
        area = admin_api.post(
            "/api/v1/areas/", {"name_en": "Savar", "name_bn": "সাভার", "district": district_id}
        )
        assert skill.status_code == 201
        assert area.status_code == 201
        assert area.json()["district_detail"]["slug"] == "dhaka-district"

    def test_admin_deactivates_skill(self, admin_api):
        skill = Skill.objects.get(slug="tv-repair")

        response = admin_api.patch(f"/api/v1/skills/{skill.id}/", {"is_active": False})
        assert response.status_code == 200
        skill.refresh_from_db()
        assert skill.is_active is False

    def test_deleting_category_with_skills_is_blocked(self, admin_api):
        category = ServiceCategory.objects.get(slug="plumbing")

        response = admin_api.delete(f"/api/v1/categories/{category.id}/")
        assert response.status_code == 409
        assert response.json()["code"] == "in_use"

    def test_deleting_unused_skill_works(self, admin_api):
        skill = Skill.objects.get(slug="tv-repair")

        assert admin_api.delete(f"/api/v1/skills/{skill.id}/").status_code == 204


class TestPermissions:
    @pytest.mark.parametrize("client_fixture", ["api_client", "customer_api"])
    def test_non_admins_cannot_write(self, request, client_fixture):
        client = request.getfixturevalue(client_fixture)

        response = client.post("/api/v1/categories/", {"name_en": "X", "name_bn": "X"})
        assert response.status_code in (401, 403)

    def test_customer_cannot_delete(self, customer_api):
        skill = Skill.objects.first()

        assert customer_api.delete(f"/api/v1/skills/{skill.id}/").status_code == 403
