from pydantic import BaseModel

from app.schemas.indicador import IndicadorSchema


class DepartamentoSummary(BaseModel):
    id: int
    slug: str
    nombre: str
    region: str | None = None
    superficie_km2: float | None = None
    feria_titular: str | None = None
    distancia_capital_km: int | None = None
    idiomas_predominantes: str | None = None
    indicadores: IndicadorSchema | None = None

    model_config = {"from_attributes": True}


class DepartamentoDetail(DepartamentoSummary):
    descripcion: str | None = None
