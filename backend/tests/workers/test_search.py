import pytest

pytestmark = pytest.mark.django_db

URL = "/api/v1/workers/"


@pytest.fixture
def workers(make_worker):
    return {
        "rahim": make_worker(
            "01811111111",
            "Rahim",
            skills=["ac-servicing", "ac-gas-refill"],
            areas=["mirpur"],
            trust_score=82,
            identity_verified=True,
            availability_status="AVAILABLE",
            verified_jobs_count=28,
        ),
        "karim": make_worker(
            "01822222222",
            "Karim",
            skills=["tap-pipe-repair"],
            areas=["dhanmondi", "mirpur"],
            trust_score=65,
            availability_status="BUSY",
            years_experience=12,
        ),
        "salam": make_worker(
            "01833333333",
            "Salam",
            skills=["house-wiring"],
            areas=["uttara"],
            trust_score=74,
            availability_status="OFFLINE",
        ),
        "incomplete": make_worker("01844444444", "No Skills Yet"),
    }


def names(response):
    return [worker["display_name"] for worker in response.json()["results"]]


def test_lists_only_complete_profiles_ordered_by_trust(api_client, workers):
    assert names(api_client.get(URL)) == ["Rahim", "Salam", "Karim"]


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("category=ac-repair", ["Rahim"]),
        ("skill=tap-pipe-repair", ["Karim"]),
        ("area=mirpur", ["Rahim", "Karim"]),
        ("min_trust=70", ["Rahim", "Salam"]),
        ("verified=true", ["Rahim"]),
        ("available=true", ["Rahim"]),
        ("search=wiring", ["Salam"]),
        ("ordering=-years_experience", ["Karim", "Rahim", "Salam"]),
    ],
)
def test_filters(api_client, workers, query, expected):
    assert names(api_client.get(f"{URL}?{query}")) == expected


def test_card_has_badges_skills_and_no_phone(api_client, workers):
    card = api_client.get(f"{URL}?area=mirpur").json()["results"][0]

    assert card["identity_verified"] is True
    assert card["verified_jobs_count"] == 28
    assert [s["slug"] for s in card["skills"]] == ["ac-servicing", "ac-gas-refill"]
    assert "phone" not in card and "user" not in card


def test_public_profile(api_client, workers):
    body = api_client.get(f"{URL}{workers['rahim'].id}/").json()

    assert body["display_name"] == "Rahim"
    assert body["trust"] == {"score": 82, "breakdown": []}
    assert body["categories"][0]["slug"] == "ac-repair"
    assert "member_since" in body
    assert "phone" not in str(body)


def test_suspended_worker_is_hidden(api_client, workers):
    user = workers["rahim"].user
    user.is_suspended = True
    user.save()

    assert "Rahim" not in names(api_client.get(URL))
    assert api_client.get(f"{URL}{workers['rahim'].id}/").status_code == 404


def test_search_query_count_is_bounded(api_client, workers, django_assert_max_num_queries):
    with django_assert_max_num_queries(6):
        api_client.get(URL)
