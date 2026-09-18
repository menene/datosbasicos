from datetime import datetime, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.models.departamento import Departamento
from app.models.indicador import Indicador
from app.models.region import Region


async def test_insert_and_query_departamento_with_region(db_session):
    region = Region(nombre="Norte")
    db_session.add(region)
    await db_session.flush()

    depto = Departamento(
        slug="alta-verapaz",
        nombre="Alta Verapaz",
        region_id=region.id,
        superficie_km2=8686.0,
    )
    db_session.add(depto)
    await db_session.commit()

    result = await db_session.execute(select(Departamento).where(Departamento.slug == "alta-verapaz"))
    row = result.scalar_one()
    assert row.nombre == "Alta Verapaz"
    assert row.region_id == region.id
    assert float(row.superficie_km2) == 8686.0
    assert row.created_at.tzinfo is not None
    assert row.created_at <= datetime.now(timezone.utc)


async def test_departamento_slug_is_unique(db_session):
    db_session.add(Departamento(slug="peten", nombre="Petén"))
    await db_session.commit()

    db_session.add(Departamento(slug="peten", nombre="Petén Duplicado"))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


async def test_insert_and_query_indicador_linked_to_departamento(db_session):
    depto = Departamento(slug="izabal", nombre="Izabal")
    db_session.add(depto)
    await db_session.flush()

    db_session.add(Indicador(departamento_id=depto.id, anio=2025, poblacion_total=450_000, idh=0.601))
    await db_session.commit()

    result = await db_session.execute(select(Indicador).where(Indicador.departamento_id == depto.id))
    row = result.scalar_one()
    assert row.anio == 2025
    assert row.poblacion_total == 450_000
    assert float(row.idh) == 0.601


async def test_indicador_unique_per_departamento_and_anio(db_session):
    depto = Departamento(slug="zacapa", nombre="Zacapa")
    db_session.add(depto)
    await db_session.flush()

    db_session.add(Indicador(departamento_id=depto.id, anio=2025))
    await db_session.commit()

    db_session.add(Indicador(departamento_id=depto.id, anio=2025))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


async def test_departamento_indicadores_relationship_loads_related_rows(db_session):
    depto = Departamento(slug="peten-rel", nombre="Petén")
    db_session.add(depto)
    await db_session.flush()

    db_session.add_all(
        [
            Indicador(departamento_id=depto.id, anio=2005, poblacion_total=350_000),
            Indicador(departamento_id=depto.id, anio=2025, poblacion_total=750_000),
        ]
    )
    await db_session.commit()

    result = await db_session.execute(
        select(Departamento)
        .where(Departamento.slug == "peten-rel")
        .options(selectinload(Departamento.indicadores))
    )
    row = result.scalar_one()
    assert {ind.anio for ind in row.indicadores} == {2005, 2025}


async def test_indicador_requires_departamento_fk(db_session):
    db_session.add(Indicador(departamento_id=999_999, anio=2025))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()
