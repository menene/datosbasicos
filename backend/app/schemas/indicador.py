from pydantic import BaseModel


class IndicadorSchema(BaseModel):
    id: int
    departamento_id: int
    anio: int

    poblacion_total: int | None = None
    poblacion_2005: int | None = None
    densidad_hab_km2: float | None = None
    pct_hombres: float | None = None
    pct_mujeres: float | None = None
    pct_urbana: float | None = None
    pct_rural: float | None = None
    pct_indigena: float | None = None

    esperanza_vida: float | None = None
    analfabetismo_pct: float | None = None
    acceso_agua_pct: float | None = None
    acceso_saneamiento_pct: float | None = None
    mortalidad_general: float | None = None
    mortalidad_materna: float | None = None

    fecundidad: float | None = None
    crecimiento_anual_pct: float | None = None
    tiempo_duplicacion_anios: float | None = None

    poblacion_activa: int | None = None
    poblacion_ocupada: int | None = None
    poblacion_desocupada: int | None = None
    ingreso_medio_anual: float | None = None

    idh_ranking: int | None = None

    model_config = {"from_attributes": True}


class IndicadorResumen(BaseModel):
    campo: str
    minimo: float | None
    maximo: float | None
    promedio: float | None
