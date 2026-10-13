// Ríos principales y sus cuencas, extraídos de los estudios hidrosociales de
// /docs/agua. Servidos por /api/v1/rios; un río toca varios departamentos.

export type Vertiente = "Pacífico" | "Caribe" | "Golfo de México";

export interface Rio {
  slug: string;
  nombre: string;
  vertiente: Vertiente;
  /** Slugs de los departamentos que drena su cuenca. */
  departamentos: string[];
  longitud_km: number | null;
  /** Para el Usumacinta, solo el tramo guatemalteco. */
  cuenca_km2: number | null;
  caudal_m3s: number | null;
  /** Estación de medición o forma de estimarlo. */
  caudal_nota: string | null;
  poblacion_cuenca: number | null;
  desembocadura: string | null;
  /** Calidad del agua, en texto (cada vertiente la mide distinto). */
  calidad: string | null;
  /**
   * La carga contaminante que publica el estudio de su vertiente. No es la misma
   * medida en todas: plástico al mar (Pacífico), DBO₅ doméstica (Caribe) o
   * desechos sólidos generados (Golfo de México); `carga_label` dice cuál es.
   */
  carga_valor: string | null;
  carga_label: string | null;
  problematica: string | null;
  fuente: string | null;
}
