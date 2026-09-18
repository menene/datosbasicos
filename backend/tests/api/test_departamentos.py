from app.models.departamento import Departamento
from app.models.indicador import Indicador
from app.models.region import Region


async def _seed_alta_verapaz(db_session) -> Departamento:
    region = Region(nombre="Norte")
    db_session.add(region)
    await db_session.flush()

    depto = Departamento(
        slug="alta-verapaz",
        nombre="Alta Verapaz",
        region_id=region.id,
        superficie_km2=8686.0,
        feria_titular="Feria de Cobán",
        distancia_capital_km=219,
        idiomas_predominantes="Q'eqchi', Poqomchi'",
        descripcion="Departamento en la región norte de Guatemala.",
    )
    db_session.add(depto)
    await db_session.flush()

    db_session.add(
        Indicador(
            departamento_id=depto.id,
            anio=2025,
            poblacion_total=1_200_000,
            densidad_hab_km2=138.15,
            idh=0.612,
        )
    )
    await db_session.commit()
    return depto


async def test_list_departamentos_returns_seeded_row(client, db_session):
    await _seed_alta_verapaz(db_session)

    res = await client.get("/api/v1/departamentos")

    assert res.status_code == 200
    body = res.json()
    row = next(d for d in body if d["slug"] == "alta-verapaz")
    assert row["region"] == "Norte"
    assert row["indicadores"]["poblacion_total"] == 1_200_000


async def test_list_departamentos_filters_by_region(client, db_session):
    await _seed_alta_verapaz(db_session)

    res = await client.get("/api/v1/departamentos", params={"region": "Norte"})
    assert res.status_code == 200
    assert all(d["region"] == "Norte" for d in res.json())

    res_empty = await client.get("/api/v1/departamentos", params={"region": "Nowhere"})
    assert res_empty.status_code == 200
    assert res_empty.json() == []


async def test_get_departamento_by_slug(client, db_session):
    await _seed_alta_verapaz(db_session)

    res = await client.get("/api/v1/departamentos/alta-verapaz")
    assert res.status_code == 200
    body = res.json()
    assert body["nombre"] == "Alta Verapaz"
    assert body["indicadores"]["idh"] == 0.612


async def test_get_departamento_by_slug_not_found(client):
    res = await client.get("/api/v1/departamentos/no-existe")
    assert res.status_code == 404
