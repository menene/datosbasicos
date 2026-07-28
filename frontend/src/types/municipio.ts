// Municipio reference data (static, single snapshot). Served by /api/v1/municipios,
// extracted from the source docs. Fields not present in the docs are null.
export interface Municipio {
  slug: string;
  nombre: string;
  departamento_slug: string;
  departamento: string;
  superficie_km2: number | null;
  poblacion_total: number | null;
  densidad_hab_km2: number | null;
  pct_hombres: number | null;
  pct_mujeres: number | null;
  pct_urbana: number | null;
  pct_rural: number | null;
  pct_indigena: number | null;
  esperanza_vida: number | null;
  analfabetismo_pct: number | null;
  acceso_agua_pct: number | null;
  acceso_saneamiento_pct: number | null;
  fecundidad: number | null;
  crecimiento_anual_pct: number | null;
}
