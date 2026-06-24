export interface Indicadores {
  id: number;
  departamento_id: number;
  anio: number;
  poblacion_total: number | null;
  poblacion_2005: number | null;
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
  mortalidad_general: number | null;
  mortalidad_materna: number | null;
  fecundidad: number | null;
  crecimiento_anual_pct: number | null;
  tiempo_duplicacion_anios: number | null;
  poblacion_activa: number | null;
  poblacion_ocupada: number | null;
  poblacion_desocupada: number | null;
  ingreso_medio_anual: number | null;
  idh_ranking: number | null;
}

export interface Departamento {
  id: number;
  slug: string;
  nombre: string;
  region: string | null;
  superficie_km2: number | null;
  feria_titular: string | null;
  distancia_capital_km: number | null;
  idiomas_predominantes: string | null;
  indicadores: Indicadores | null;
}

export interface DepartamentoDetail extends Departamento {
  descripcion: string | null;
}

export interface IndicadorResumen {
  campo: string;
  minimo: number | null;
  maximo: number | null;
  promedio: number | null;
}

export type VariableKey = keyof Omit<Indicadores, "id" | "departamento_id" | "anio">;

export interface Variable {
  key: VariableKey;
  label: string;
  formato: "numero" | "decimal" | "porcentaje";
}

export const VARIABLES: Variable[] = [
  { key: "poblacion_total", label: "Población total", formato: "numero" },
  { key: "densidad_hab_km2", label: "Densidad (hab/km²)", formato: "decimal" },
  { key: "pct_urbana", label: "Población urbana (%)", formato: "porcentaje" },
  { key: "pct_rural", label: "Población rural (%)", formato: "porcentaje" },
  { key: "pct_indigena", label: "Población indígena (%)", formato: "porcentaje" },
  { key: "pct_hombres", label: "Hombres (%)", formato: "porcentaje" },
  { key: "pct_mujeres", label: "Mujeres (%)", formato: "porcentaje" },
  { key: "analfabetismo_pct", label: "Analfabetismo (%)", formato: "porcentaje" },
  { key: "acceso_agua_pct", label: "Acceso agua (%)", formato: "porcentaje" },
  { key: "acceso_saneamiento_pct", label: "Acceso saneamiento (%)", formato: "porcentaje" },
  { key: "esperanza_vida", label: "Esperanza de vida", formato: "decimal" },
  { key: "fecundidad", label: "Tasa de fecundidad", formato: "decimal" },
  { key: "crecimiento_anual_pct", label: "Crecimiento anual (%)", formato: "porcentaje" },
  { key: "tiempo_duplicacion_anios", label: "Tiempo de duplicación (años)", formato: "decimal" },
  { key: "mortalidad_general", label: "Mortalidad general (×1000 hab.)", formato: "decimal" },
  { key: "mortalidad_materna", label: "Mortalidad materna (×1000 n.v.)", formato: "decimal" },
  { key: "poblacion_activa", label: "Población activa", formato: "numero" },
  { key: "poblacion_ocupada", label: "Población ocupada", formato: "numero" },
  { key: "poblacion_desocupada", label: "Población desocupada", formato: "numero" },
  { key: "ingreso_medio_anual", label: "Ingreso medio anual (Q.)", formato: "decimal" },
  { key: "idh_ranking", label: "Ranking IDH", formato: "numero" },
] as const;

export const VARIABLES_ALERTA: VariableKey[] = [
  "analfabetismo_pct",
  "mortalidad_general",
  "mortalidad_materna",
  "poblacion_desocupada",
];
