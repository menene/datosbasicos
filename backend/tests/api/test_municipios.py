async def test_list_municipios_returns_data(client):
    res = await client.get("/api/v1/municipios")
    assert res.status_code == 200
    body = res.json()
    assert len(body) > 0
    assert {"slug", "nombre", "departamento_slug"} <= body[0].keys()


async def test_list_municipios_filters_by_departamento(client):
    res = await client.get("/api/v1/municipios", params={"departamento": "alta-verapaz"})
    assert res.status_code == 200
    body = res.json()
    assert len(body) > 0
    assert all(m["departamento_slug"] == "alta-verapaz" for m in body)


async def test_get_municipio_by_slug(client):
    res = await client.get("/api/v1/municipios/cahabon", params={"departamento": "alta-verapaz"})
    assert res.status_code == 200
    assert res.json()["nombre"] == "Cahabón"


async def test_get_municipio_not_found(client):
    res = await client.get("/api/v1/municipios/no-existe")
    assert res.status_code == 404
