from sqlalchemy import func, select

from app.models.departamento import Departamento
from app.models.indicador import Indicador
from app.models.region import Region
from app.seed.seed import DATA_PATH, seed


async def test_seed_loads_all_departamentos_and_regions(db_session):
    await seed(db_session)

    total_deptos = await db_session.scalar(select(func.count()).select_from(Departamento))
    assert total_deptos == 22

    total_regiones = await db_session.scalar(select(func.count()).select_from(Region))
    assert total_regiones > 0

    guatemala = (
        await db_session.execute(select(Departamento).where(Departamento.slug == "guatemala"))
    ).scalar_one()
    assert guatemala.nombre == "Guatemala"
    assert guatemala.region_id is not None


async def test_seed_loads_indicadores_for_multiple_years(db_session):
    await seed(db_session)

    depto = (
        await db_session.execute(select(Departamento).where(Departamento.slug == "guatemala"))
    ).scalar_one()

    anios = (
        await db_session.execute(
            select(Indicador.anio).where(Indicador.departamento_id == depto.id)
        )
    ).scalars().all()
    assert 1994 in anios
    assert 2025 in anios


async def test_seed_is_idempotent(db_session):
    await seed(db_session)
    await seed(db_session)

    total_deptos = await db_session.scalar(select(func.count()).select_from(Departamento))
    assert total_deptos == 22

    guatemala = (
        await db_session.execute(select(Departamento).where(Departamento.slug == "guatemala"))
    ).scalar_one()
    total_indicadores_2025 = await db_session.scalar(
        select(func.count())
        .select_from(Indicador)
        .where(Indicador.departamento_id == guatemala.id, Indicador.anio == 2025)
    )
    assert total_indicadores_2025 == 1


async def test_seed_data_file_exists():
    assert DATA_PATH.exists()
