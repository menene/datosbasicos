from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.departamento import Departamento
from app.models.indicador import Indicador
from app.models.region import Region


async def get_departamentos(
    db: AsyncSession,
    region: str | None = None,
    orden: str | None = None,
    dir: str = "asc",
    anio: int = 2025,
) -> list[Departamento]:
    # Join departamento -> indicador (for anio) -> region
    stmt = (
        select(Departamento)
        .options(
            selectinload(Departamento.region_obj),
            selectinload(Departamento.indicadores),
        )
    )

    if region:
        stmt = stmt.join(Departamento.region_obj).where(Region.nombre == region)

    deptos = (await db.execute(stmt)).scalars().all()

    # Filter indicadores to the requested year and attach as .indicador_activo
    for d in deptos:
        d.indicador_activo = next(
            (i for i in d.indicadores if i.anio == anio), None
        )

    # Sort in Python if ordering by indicador field
    INDICADOR_FIELDS = {
        "poblacion_total", "densidad_hab_km2", "pct_urbana", "pct_indigena",
        "esperanza_vida", "analfabetismo_pct", "acceso_agua_pct", "fecundidad",
        "crecimiento_anual_pct", "idh_ranking",
    }

    if orden:
        reverse = dir == "desc"
        if orden in INDICADOR_FIELDS:
            deptos = sorted(
                deptos,
                key=lambda d: getattr(d.indicador_activo, orden, None) or 0,
                reverse=reverse,
            )
        elif orden == "nombre":
            deptos = sorted(deptos, key=lambda d: d.nombre, reverse=reverse)

    return list(deptos)


async def get_departamento_by_slug(
    db: AsyncSession,
    slug: str,
    anio: int = 2025,
) -> Departamento | None:
    stmt = (
        select(Departamento)
        .where(Departamento.slug == slug)
        .options(
            selectinload(Departamento.region_obj),
            selectinload(Departamento.indicadores),
        )
    )
    result = await db.execute(stmt)
    depto = result.scalar_one_or_none()
    if depto:
        depto.indicador_activo = next(
            (i for i in depto.indicadores if i.anio == anio), None
        )
    return depto
