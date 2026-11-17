import pytest

from apps.accounts.models import User
from apps.catalog.models import Skill
from apps.workers.services import set_skills

pytestmark = pytest.mark.django_db

ME_URL = "/api/v1/workers/me/"
PRICES_URL = "/api/v1/workers/me/skill-prices/"


def _skill(slug):
    return Skill.objects.get(slug=slug)


def _give_skills(profile, *slugs):
    set_skills(profile, [_skill(slug).id for slug in slugs])


def test_worker_sets_and_clears_visit_charge(worker_api):
    assert (
        worker_api.patch(ME_URL, {"visit_charge": 300}, format="json").json()["visit_charge"] == 300
    )

    body = worker_api.patch(ME_URL, {"visit_charge": None}, format="json").json()

    assert body["visit_charge"] is None


@pytest.mark.parametrize("value", [-1, 100_001])
def test_visit_charge_out_of_range_is_rejected(worker_api, value):
    response = worker_api.patch(ME_URL, {"visit_charge": value}, format="json")

    assert response.status_code == 400
    assert "visit_charge" in response.json()["errors"]


def test_worker_sets_starting_price_per_skill(worker_api):
    _give_skills(worker_api.profile, "ac-servicing", "ac-gas-refill")
    servicing, refill = _skill("ac-servicing"), _skill("ac-gas-refill")

    response = worker_api.put(
        PRICES_URL,
        {"prices": [{"skill": servicing.id, "price": 800}, {"skill": refill.id, "price": None}]},
        format="json",
    )

    assert response.status_code == 200
    prices = {item["slug"]: item["starting_price"] for item in response.json()["skills"]}
    assert prices == {"ac-servicing": 800, "ac-gas-refill": None}


def test_price_for_a_skill_the_worker_lacks_is_rejected(worker_api):
    _give_skills(worker_api.profile, "ac-servicing")

    response = worker_api.put(
        PRICES_URL,
        {"prices": [{"skill": _skill("house-wiring").id, "price": 500}]},
        format="json",
    )

    assert response.status_code == 400
    assert worker_api.profile.skill_links.get().starting_price is None


def test_price_out_of_range_is_rejected(worker_api):
    _give_skills(worker_api.profile, "ac-servicing")

    response = worker_api.put(
        PRICES_URL,
        {"prices": [{"skill": _skill("ac-servicing").id, "price": 100_001}]},
        format="json",
    )

    assert response.status_code == 400


def test_kept_skills_keep_their_price_when_skills_change(worker_api):
    _give_skills(worker_api.profile, "ac-servicing")
    worker_api.put(
        PRICES_URL,
        {"prices": [{"skill": _skill("ac-servicing").id, "price": 800}]},
        format="json",
    )

    _give_skills(worker_api.profile, "ac-servicing", "ac-gas-refill")

    prices = dict(worker_api.profile.skill_links.values_list("skill__slug", "starting_price"))
    assert prices == {"ac-servicing": 800, "ac-gas-refill": None}


def test_customer_cannot_set_skill_prices(api_client):
    customer = User.objects.create_user(phone="01712345678", password="x", full_name="N")
    api_client.force_authenticate(customer)

    assert api_client.put(PRICES_URL, {"prices": []}, format="json").status_code == 403


def test_public_search_and_profile_show_prices(api_client, make_worker):
    profile = make_worker(
        "01812345679", "Karim", skills=["tap-pipe-repair"], areas=["mirpur"], visit_charge=200
    )
    profile.skill_links.update(starting_price=400)

    card = api_client.get("/api/v1/workers/").json()["results"][0]
    detail = api_client.get(f"/api/v1/workers/{profile.id}/").json()

    for body in (card, detail):
        assert body["visit_charge"] == 200
        assert body["skills"][0]["starting_price"] == 400
