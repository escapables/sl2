import responses


def test_search_missing_query_returns_400(client):
    resp = client.get("/api/search")
    assert resp.status_code == 400
    assert resp.get_json()["error"]


def test_search_missing_key_returns_401(client):
    resp = client.get("/api/search?q=Stockholm")
    assert resp.status_code == 401


@responses.activate
def test_search_ok_proxies_to_resrobot(client):
    responses.get(
        "https://api.resrobot.se/v2.1/location.name",
        json={"StopLocation": [{"name": "Stockholm C", "extId": "740000001"}]},
        status=200,
    )
    resp = client.get("/api/search?q=Stockholm", headers={"X-API-Key": "k"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "StopLocation" in data


def test_route_missing_params_returns_400(client):
    resp = client.get("/api/route?from=1")
    assert resp.status_code == 400


@responses.activate
def test_route_proxies_success(client):
    responses.get(
        "https://api.resrobot.se/v2.1/trip",
        json={"Trip": [{"LegList": {"Leg": []}}]},
        status=200,
    )
    resp = client.get(
        "/api/route?from=1&to=2",
        headers={"X-API-Key": "k"},
    )
    assert resp.status_code == 200
    assert "Trip" in resp.get_json()


@responses.activate
def test_route_returns_error_body_with_200(client):
    responses.get(
        "https://api.resrobot.se/v2.1/trip",
        body="Bad request",
        status=400,
    )
    resp = client.get(
        "/api/route?from=1&to=2",
        headers={"X-API-Key": "k"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "error" in data
    assert data["status_code"] == 400


@responses.activate
def test_departures_ok(client):
    responses.get(
        "https://api.resrobot.se/v2.1/departureBoard",
        json={"Departure": []},
        status=200,
    )
    resp = client.get(
        "/api/departures?id=1",
        headers={"X-API-Key": "k"},
    )
    assert resp.status_code == 200
    assert "Departure" in resp.get_json()


@responses.activate
def test_validate_key_ok(client):
    responses.get(
        "https://api.resrobot.se/v2.1/location.name",
        json={"StopLocation": [{"name": "Stockholm C", "extId": "740000001"}]},
        status=200,
    )
    resp = client.post("/api/validate-key", headers={"X-API-Key": "k"})
    assert resp.status_code == 200
    assert resp.get_json()["valid"] is True
