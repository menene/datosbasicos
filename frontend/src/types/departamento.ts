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
  matrimonios_por_1000: number | null;
  pct_uniones_consensuales: number | null;
  edad_primera_union: number | null;
  poblacion_activa: number | null;
  poblacion_ocupada: number | null;
  poblacion_desocupada: number | null;
  ingreso_medio_anual: number | null;
  idh: number | null;
  idh_salud: number | null;
  idh_educacion: number | null;
  idh_ingresos: number | null;
  idh_ranking: number | null;
  padron_electoral: number | null;
  votos_emitidos: number | null;
  abstencionismo_pct: number | null;
  participacion_pct: number | null;
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
  formato: "numero" | "decimal" | "porcentaje" | "indice";
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
  { key: "matrimonios_por_1000", label: "Matrimonios (×1000 hab.)", formato: "decimal" },
  { key: "edad_primera_union", label: "Edad 1ª unión, mujeres (años)", formato: "decimal" },
  { key: "pct_uniones_consensuales", label: "Uniones de hecho (%)", formato: "porcentaje" },
  { key: "mortalidad_general", label: "Mortalidad general (×1000 hab.)", formato: "decimal" },
  { key: "mortalidad_materna", label: "Mortalidad materna (×1000 n.v.)", formato: "decimal" },
  { key: "poblacion_activa", label: "Población activa", formato: "numero" },
  { key: "poblacion_ocupada", label: "Población ocupada", formato: "numero" },
  { key: "poblacion_desocupada", label: "Población desocupada", formato: "numero" },
  { key: "ingreso_medio_anual", label: "Ingreso medio anual (Q.)", formato: "decimal" },
  { key: "idh", label: "IDH", formato: "indice" },
  { key: "idh_salud", label: "IDH · Salud", formato: "indice" },
  { key: "idh_educacion", label: "IDH · Educación", formato: "indice" },
  { key: "idh_ingresos", label: "IDH · Ingresos", formato: "indice" },
  { key: "idh_ranking", label: "Ranking IDH", formato: "numero" },
  { key: "padron_electoral", label: "Padrón electoral (2023)", formato: "numero" },
  { key: "votos_emitidos", label: "Votos emitidos (2023)", formato: "numero" },
  { key: "participacion_pct", label: "Participación electoral 2023 (%)", formato: "porcentaje" },
  { key: "abstencionismo_pct", label: "Abstencionismo 2023 (%)", formato: "porcentaje" },
] as const;

/**
 * Advertencias por indicador y año, para los casos en que el dato no significa lo
 * que aparenta. Se muestran junto al mapa y al pie de la tabla.
 */
interface NotaIndicador {
  keys: VariableKey[];
  anios: number[];
  texto: string;
}

const NOTAS_INDICADOR: NotaIndicador[] = [
  {
    keys: ["acceso_agua_pct", "acceso_saneamiento_pct"],
    anios: [1994],
    texto:
      "En 1994 estas coberturas son una estimación nacional aplicada por igual a los " +
      "22 departamentos (60 % agua, 57 % saneamiento): el libro las publica en personas, " +
      "pero cada cifra es ese porcentaje de la población del departamento, así que no " +
      "hay variación departamental medida.",
  },
];

/** Advertencia aplicable a un indicador en un año, si la hay. */
export function notaIndicador(key: VariableKey, anio: number): string | null {
  const nota = NOTAS_INDICADOR.find(
    (n) => n.keys.includes(key) && n.anios.includes(anio)
  );
  return nota?.texto ?? null;
}

export const VARIABLES_ALERTA: VariableKey[] = [
  "analfabetismo_pct",
  "mortalidad_general",
  "mortalidad_materna",
  "poblacion_desocupada",
  "abstencionismo_pct",
];
