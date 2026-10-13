async def test_list_rios_returns_data(client):
    res = await client.get("/api/v1/rios")
    assert res.status_code == 200
    body = res.json()
    assert len(body) > 0
    assert {"slug", "nombre", "vertiente", "departamentos"} <= body[0].keys()


async def test_list_rios_filters_by_departamento(client):
    res = await client.get("/api/v1/rios", params={"departamento": "izabal"})
    assert res.status_code == 200
    body = res.json()
    assert {"motagua", "polochic", "rio-dulce"} <= {r["slug"] for r in body}
    assert all("izabal" in r["departamentos"] for r in body)


async def test_get_rio_by_slug(client):
    res = await client.get("/api/v1/rios/maria-linda")
    assert res.status_code == 200
    assert res.json()["vertiente"] == "Pacífico"


async def test_get_rio_not_found(client):
    res = await client.get("/api/v1/rios/no-existe")
    assert res.status_code == 404
