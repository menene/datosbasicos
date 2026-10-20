// Explorador de gráficas: filas normalizadas (un registro por lugar y año) para
// departamentos y municipios, y el estado de la vista, que vive en la URL para
// que cualquier gráfica armada se pueda compartir como enlace.
import type { DepartamentosPorAnio } from "@/api/departamentos";
import { ANIO_MUNICIPIOS } from "@/lib/totales";
import { TODAS_LAS_VARIABLES } from "@/types/departamento";
import type { Variable, VariableKey } from "@/types/departamento";
import type { CategoriaVulnerabilidad, Municipio } from "@/types/municipio";

export type Nivel = "departamentos" | "municipios";
export type Tipo = "ranking" | "dispersion" | "evolucion";
export type ModoColor = "uno" | "region" | "depto" | "categoria";

export const ANIOS_NIVEL: Record<Nivel, number[]> = {
  departamentos: [1994, 2005, 2025],
  municipios: [1994, 2005, 2018, ANIO_MUNICIPIOS],
};

export const REGIONES: Record<string, string> = {
  metropolitana: "Metropolitana",
  norte: "Norte",
  nororiental: "Nororiental",
  suroriente: "Suroriente",
  central: "Central",
  surcentral: "Sur central",
  suroccidente: "Suroccidente",
  noroccidente: "Noroccidente",
  peten: "Petén",
};

export interface Fila {
  /** Único por lugar (no por año): "alta-verapaz" o "alta-verapaz/coban". */
  id: string;
  nombre: string;
  ruta: string;
  region: string | null;
  deptoSlug: string;
  deptoNombre: string;
  /** Categoría del índice de vulnerabilidad (solo municipios, corte único). */
  categoria: CategoriaVulnerabilidad | null;
  anio: number;
  valores: Partial<Record<VariableKey, number>>;
}

function numericos(obj: Record<string, unknown> | null | undefined) {
  const out: Partial<Record<VariableKey, number>> = {};
  for (const [k, v] of Object.entries(obj ?? {})) {
    if (typeof v === "number") out[k as VariableKey] = v;
  }
  return out;
}

export function filasDepartamentos(porAnio: DepartamentosPorAnio[]): Fila[] {
  return porAnio.flatMap(({ anio, data }) =>
    data.map((d) => ({
      id: d.slug,
      nombre: d.nombre,
      ruta: `/ficha/${d.slug}`,
      region: d.region,
      deptoSlug: d.slug,
      deptoNombre: d.nombre,
      categoria: null,
      anio,
      valores: numericos(d.indicadores as unknown as Record<string, unknown>),
    }))
  );
}

/** El registro principal es el corte 2025; `series` trae los años anteriores. */
export function filasMunicipios(
  municipios: Municipio[],
  regionDe: Map<string, string | null>
): Fila[] {
  return municipios.flatMap((m) => {
    const base = {
      id: `${m.departamento_slug}/${m.slug}`,
      nombre: m.nombre,
      ruta: `/ficha/${m.departamento_slug}/${m.slug}`,
      region: regionDe.get(m.departamento_slug) ?? null,
      deptoSlug: m.departamento_slug,
      deptoNombre: m.departamento,
      categoria: m.vulnerabilidad_categoria,
    };
    const { series, ...actual } = m;
    return [
      ...Object.entries(series ?? {}).map(([anio, corte]) => ({
        ...base,
        anio: Number(anio),
        valores: numericos(corte),
      })),
      { ...base, anio: ANIO_MUNICIPIOS, valores: numericos(actual) },
    ];
  });
}

/** Variables con al menos un dato en las filas; la categórica de niveles no se grafica. */
export function variablesConDatos(filas: Fila[]): Variable[] {
  const presentes = new Set<string>();
  for (const f of filas) for (const k of Object.keys(f.valores)) presentes.add(k);
  return TODAS_LAS_VARIABLES.filter(
    (v) => v.formato !== "nivel" && presentes.has(v.key)
  );
}

export const infoVariable = (key: VariableKey): Variable =>
  TODAS_LAS_VARIABLES.find((v) => v.key === key) ?? {
    key,
    label: key,
    formato: "decimal",
  };

// ── Estado en la URL ────────────────────────────────────────────────────────

export interface Estado {
  nivel: Nivel;
  tipo: Tipo;
  /** Variable principal: barras del ranking, eje Y de la dispersión, líneas. */
  v: VariableKey;
  /** Eje X de la dispersión. */
  x: VariableKey;
  anio: number;
  region: string | null;
  depto: string | null;
  categorias: CategoriaVulnerabilidad[];
  min: number | null;
  max: number | null;
  orden: "desc" | "asc";
  /** Cuántos lugares mostrar; null = todos. */
  limite: number | null;
  color: ModoColor;
  /** Región o departamento resaltado, según `color`. */
  resaltar: string | null;
}

export const PREDETERMINADO: Estado = {
  nivel: "departamentos",
  tipo: "ranking",
  v: "analfabetismo_pct",
  x: "acceso_agua_pct",
  anio: 2025,
  region: null,
  depto: null,
  categorias: [],
  min: null,
  max: null,
  orden: "desc",
  limite: null,
  color: "uno",
  resaltar: null,
};

/** 340 barras no se leen: los municipios arrancan en los 20 primeros. */
export const LIMITE_MUNICIPIOS = 20;

const CATEGORIAS: CategoriaVulnerabilidad[] = ["muy baja", "baja", "media", "alta", "muy alta"];

const num = (s: string | null) => {
  if (s === null || s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export function leerEstado(p: URLSearchParams): Estado {
  const nivel: Nivel = p.get("nivel") === "municipios" ? "municipios" : "departamentos";
  const tipoRaw = p.get("tipo");
  const tipo: Tipo =
    tipoRaw === "dispersion" || tipoRaw === "evolucion" ? tipoRaw : "ranking";
  const anio = num(p.get("anio"));
  const colorRaw = p.get("color");
  const color: ModoColor =
    colorRaw === "region" || colorRaw === "depto" || colorRaw === "categoria"
      ? colorRaw
      : "uno";
  const limiteRaw = p.get("n");
  return {
    nivel,
    tipo,
    v: (p.get("v") as VariableKey) || PREDETERMINADO.v,
    x: (p.get("x") as VariableKey) || PREDETERMINADO.x,
    anio: anio !== null && ANIOS_NIVEL[nivel].includes(anio) ? anio : 2025,
    region: p.get("region"),
    depto: nivel === "municipios" ? p.get("depto") : null,
    categorias:
      nivel === "municipios"
        ? (p.get("cat") ?? "")
            .split(",")
            .filter((c): c is CategoriaVulnerabilidad =>
              CATEGORIAS.includes(c as CategoriaVulnerabilidad)
            )
        : [],
    min: num(p.get("min")),
    max: num(p.get("max")),
    orden: p.get("orden") === "asc" ? "asc" : "desc",
    limite:
      limiteRaw === "todos"
        ? null
        : num(limiteRaw) ?? (nivel === "municipios" ? LIMITE_MUNICIPIOS : null),
    // Las opciones solo municipales no aplican a departamentos.
    color: nivel === "departamentos" && (color === "depto" || color === "categoria") ? "uno" : color,
    resaltar: p.get("res"),
  };
}

/** Solo escribe lo que difiere del valor por defecto, para enlaces cortos. */
export function escribirEstado(e: Estado): Record<string, string> {
  const p: Record<string, string> = {};
  if (e.nivel !== PREDETERMINADO.nivel) p.nivel = e.nivel;
  if (e.tipo !== PREDETERMINADO.tipo) p.tipo = e.tipo;
  if (e.v !== PREDETERMINADO.v) p.v = e.v;
  if (e.tipo === "dispersion" && e.x !== PREDETERMINADO.x) p.x = e.x;
  if (e.anio !== PREDETERMINADO.anio && e.tipo !== "evolucion") p.anio = String(e.anio);
  if (e.region) p.region = e.region;
  if (e.depto) p.depto = e.depto;
  if (e.categorias.length) p.cat = e.categorias.join(",");
  if (e.min !== null) p.min = String(e.min);
  if (e.max !== null) p.max = String(e.max);
  if (e.orden !== PREDETERMINADO.orden) p.orden = e.orden;
  const limiteBase = e.nivel === "municipios" ? LIMITE_MUNICIPIOS : null;
  if (e.limite !== limiteBase) p.n = e.limite === null ? "todos" : String(e.limite);
  if (e.color !== "uno") p.color = e.color;
  if (e.resaltar && (e.color === "region" || e.color === "depto")) p.res = e.resaltar;
  return p;
}

// ── Filtros y estadísticas ──────────────────────────────────────────────────

/** Filtros de lugar (región, departamento, categoría); no dependen del año. */
export function pasaFiltrosLugar(f: Fila, e: Estado): boolean {
  if (e.region && f.region !== e.region) return false;
  if (e.depto && f.deptoSlug !== e.depto) return false;
  if (e.categorias.length && (!f.categoria || !e.categorias.includes(f.categoria))) return false;
  return true;
}

export function pasaRango(valor: number | undefined, e: Estado): boolean {
  if (valor === undefined) return false;
  if (e.min !== null && valor < e.min) return false;
  if (e.max !== null && valor > e.max) return false;
  return true;
}

export function mediana(vals: number[]): number | null {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Correlación de Pearson; null con menos de tres puntos o sin varianza. */
export function pearson(pts: Array<{ x: number; y: number }>): number | null {
  const n = pts.length;
  if (n < 3) return null;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const p of pts) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}
