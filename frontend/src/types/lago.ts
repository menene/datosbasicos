// Datos de referencia de los lagos principales de Guatemala (estáticos, sin
// dimensión temporal). Los sirve /api/v1/lagos desde seed/data/lagos.json.
// Los campos que una fuente no documenta quedan en null o en lista vacía: cada
// bloque de la ficha se dibuja solo si tiene contenido.

export interface ParametroLago {
  label: string;
  valor: string;
  /** Año o rango de años de la medición, cuando la fuente lo precisa. */
  periodo?: string;
  /** Matiz de la cifra (p. ej. la serie histórica detrás del valor). */
  detalle?: string;
}

export interface MonitoreoLago {
  titulo: string;
  alianza: string;
  frecuencia: string;
  sitios: string[];
  mide: string[];
  base_historica: string | null;
}

export interface LineaInvestigacion {
  area: string;
  lineas: string[];
}

export interface FuenteLago {
  nombre: string;
  url: string | null;
}

/** Escala cualitativa de contaminación; ordena el color del indicador. */
export type NivelContaminacion = "muy_alto" | "alto" | "moderado" | "bajo";

export interface Lago {
  slug: string;
  nombre: string;
  /** Slug del polígono en guatemala_municipios.geojson; null si no tiene forma. */
  geo_slug: string | null;
  /** Slug del sitio de interés correspondiente: su ficha larga es /sitio/<slug>. */
  sitio_slug: string;
  departamento_slug: string;
  departamento: string;
  /** Superficie lacustre (no incluye la cuenca). */
  area_km2: number | null;
  area_nota: string | null;
  /** Cuenca completa: tierra + lago. */
  cuenca_km2: number | null;
  cuenca_nota: string | null;
  altitud_msnm: number | null;
  altitud_texto: string | null;
  profundidad_max_m: number | null;
  profundidad_texto: string | null;
  dimensiones: string | null;
  tipo: string | null;
  poblacion_cuenca: number | null;
  clasificacion_trofica: string | null;
  nivel_contaminacion: NivelContaminacion | null;
  nivel_contaminacion_texto: string | null;
  tendencia: string | null;
  /** Índice de calidad del agua, tal como lo publica la fuente. */
  ica: string | null;
  parametros: ParametroLago[];
  diagnostico: string[];
  fuentes_contaminacion: string[];
  amenazas: string[];
  estado_actual: string | null;
  monitoreo: MonitoreoLago | null;
  investigacion: LineaInvestigacion[];
  conclusiones: string[];
  recomendaciones: string[];
  institucion: string | null;
  fuentes: FuenteLago[];
}
