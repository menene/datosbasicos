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

    matrimonios_por_1000: float | None = None
    pct_uniones_consensuales: float | None = None
    edad_primera_union: float | None = None

    poblacion_activa: int | None = None
    poblacion_ocupada: int | None = None
    poblacion_desocupada: int | None = None
    ingreso_medio_anual: float | None = None

    idh: float | None = None
    idh_salud: float | None = None
    idh_educacion: float | None = None
    idh_ingresos: float | None = None
    idh_ranking: int | None = None

    padron_electoral: int | None = None
    votos_emitidos: int | None = None
    abstencionismo_pct: float | None = None
    participacion_pct: float | None = None

    model_config = {"from_attributes": True}


class IndicadorResumen(BaseModel):
    campo: str
    minimo: float | None
    maximo: float | None
    promedio: float | None
