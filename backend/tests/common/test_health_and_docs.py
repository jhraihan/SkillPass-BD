def test_health_returns_ok(api_client):
    response = api_client.get("/api/v1/health/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_schema_is_served(api_client):
    response = api_client.get("/api/schema/")

    assert response.status_code == 200
    assert b"SkillPass BD API" in response.content
