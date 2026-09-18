async def test_geo_departamentos_returns_feature_collection(client):
    res = await client.get("/api/v1/geo/departamentos")
    assert res.status_code == 200
    assert res.json()["type"] == "FeatureCollection"


async def test_geo_municipios_returns_feature_collection(client):
    res = await client.get("/api/v1/geo/municipios")
    assert res.status_code == 200
    body = res.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) > 0


async def test_geo_lagos_returns_only_lago_features(client):
    res = await client.get("/api/v1/geo/lagos")
    assert res.status_code == 200
    body = res.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) > 0
    for feature in body["features"]:
        assert feature["properties"]["shapeName"].lower().startswith("lago")
