from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.indicador import Indicador
from app.schemas.indicador import IndicadorResumen

router = APIRouter(prefix="/indicadores", tags=["indicadores"])

CAMPOS_NUMERICOS = [
    "poblacion_total",
    "densidad_hab_km2",
    "pct_urbana",
    "pct_rural",
    "pct_indigena",
    "pct_hombres",
    "pct_mujeres",
    "esperanza_vida",
    "analfabetismo_pct",
    "acceso_agua_pct",
    "acceso_saneamiento_pct",
    "fecundidad",
    "crecimiento_anual_pct",
    "idh_ranking",
]


@router.get("/resumen", response_model=list[IndicadorResumen])
async def get_resumen(
    anio: int = Query(2025),
    db: AsyncSession = Depends(get_db),
):
    resultado = []
    for campo in CAMPOS_NUMERICOS:
        col = getattr(Indicador, campo)
        stmt = select(
            func.min(col).label("minimo"),
            func.max(col).label("maximo"),
            func.avg(col).label("promedio"),
        ).where(Indicador.anio == anio)
        row = (await db.execute(stmt)).one()
        resultado.append(
            IndicadorResumen(
                campo=campo,
                minimo=float(row.minimo) if row.minimo is not None else None,
                maximo=float(row.maximo) if row.maximo is not None else None,
                promedio=float(row.promedio) if row.promedio is not None else None,
            )
        )
    return resultado
