from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.crud.departamento import get_departamentos, get_departamento_by_slug
from app.schemas.departamento import DepartamentoSummary, DepartamentoDetail
from app.schemas.indicador import IndicadorSchema

router = APIRouter(prefix="/departamentos", tags=["departamentos"])


def _to_summary(d) -> DepartamentoSummary:
    ind = getattr(d, "indicador_activo", None)
    return DepartamentoSummary(
        id=d.id,
        slug=d.slug,
        nombre=d.nombre,
        region=d.region_obj.nombre if d.region_obj else None,
        superficie_km2=float(d.superficie_km2) if d.superficie_km2 is not None else None,
        indicadores=IndicadorSchema.model_validate(ind) if ind else None,
    )


def _to_detail(d) -> DepartamentoDetail:
    ind = getattr(d, "indicador_activo", None)
    return DepartamentoDetail(
        id=d.id,
        slug=d.slug,
        nombre=d.nombre,
        region=d.region_obj.nombre if d.region_obj else None,
        superficie_km2=float(d.superficie_km2) if d.superficie_km2 is not None else None,
        descripcion=d.descripcion,
        indicadores=IndicadorSchema.model_validate(ind) if ind else None,
    )


@router.get("", response_model=list[DepartamentoSummary])
async def list_departamentos(
    region: str | None = Query(None),
    orden: str | None = Query(None),
    dir: str = Query("asc", pattern="^(asc|desc)$"),
    anio: int = Query(2025),
    db: AsyncSession = Depends(get_db),
):
    deptos = await get_departamentos(db, region=region, orden=orden, dir=dir, anio=anio)
    return [_to_summary(d) for d in deptos]


@router.get("/{slug}", response_model=DepartamentoDetail)
async def get_departamento(
    slug: str,
    anio: int = Query(2025),
    db: AsyncSession = Depends(get_db),
):
    depto = await get_departamento_by_slug(db, slug=slug, anio=anio)
    if not depto:
        raise HTTPException(status_code=404, detail="Departamento no encontrado")
    return _to_detail(depto)
