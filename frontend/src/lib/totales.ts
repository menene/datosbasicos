import { VARIABLES } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";
import { calcularDensidad, calcularDuplicacion } from "@/lib/derivados";

/**
 * National aggregation for Guatemala.
 *
 * Indicators fall into four classes:
 *  - Additive  → summed across entities (población, superficie, PEA…).
 *  - Derived   → recomputed from the national aggregate, never averaged:
 *                densidad = población total / superficie total, y
 *                tiempo de duplicación = 70 / tasa nacional de crecimiento.
 *                Promediar densidades departamentales daría un número sin sentido
 *                (la capital pesaría lo mismo que Petén).
 *  - Rates/%   → simple (unweighted) average of the entities that have data.
 *  - Ranking   → not aggregatable; always null (a rank has no total/average).
 *
 * Note: the average is intentionally *unweighted* (each departamento counts
 * the same regardless of population), so national rates are approximate and
 * will not match census-weighted figures exactly.
 */

/** Keys whose national figure is a sum, not an average. */
export const CLAVES_ADITIVAS: ReadonlySet<VariableKey> = new Set<VariableKey>([
  "poblacion_total",
  "poblacion_2005",
  "poblacion_activa",
  "poblacion_ocupada",
  "poblacion_desocupada",
]);

/** Keys computed from the aggregate with their own formula (ver lib/derivados). */
export const CLAVES_DERIVADAS: ReadonlySet<VariableKey> = new Set<VariableKey>([
  "densidad_hab_km2",
  "tiempo_duplicacion_anios",
]);

/** Keys we never aggregate — a ranking can't be summed or averaged. */
export const CLAVES_SIN_TOTAL: ReadonlySet<VariableKey> = new Set<VariableKey>([
  "idh_ranking",
]);

export const esAditiva = (key: VariableKey): boolean => CLAVES_ADITIVAS.has(key);

/** One aggregatable entity: any object carrying indicator fields + superficie. */
export type FilaAgregable = Partial<Record<VariableKey, number | null>> & {
  superficie_km2?: number | null;
};

export interface AgregadoNacional {
  /** National figure per indicator (sum, average, or null). */
  valores: Record<VariableKey, number | null>;
  /** Sum of surface area across entities. */
  superficie_km2: number | null;
  /** How many entities were aggregated (had at least one value). */
  n: number;
}

/**
 * Aggregate a list of entities (departamentos or municipios) into a single
 * national record. Nulls are skipped; a key with no data anywhere → null.
 */
export function agregarNacional(filas: FilaAgregable[]): AgregadoNacional {
  const valores = {} as Record<VariableKey, number | null>;

  for (const { key } of VARIABLES) {
    if (CLAVES_SIN_TOTAL.has(key) || CLAVES_DERIVADAS.has(key)) {
      valores[key] = null; // las derivadas se resuelven abajo, con los totales ya sumados
      continue;
    }
    let suma = 0;
    let cuenta = 0;
    for (const fila of filas) {
      const v = fila[key];
      if (typeof v === "number" && Number.isFinite(v)) {
        suma += v;
        cuenta += 1;
      }
    }
    valores[key] =
      cuenta === 0 ? null : CLAVES_ADITIVAS.has(key) ? suma : suma / cuenta;
  }

  let sup = 0;
  let supN = 0;
  // Para la densidad se suman solo las entidades que tienen las dos cifras: dividir
  // la población de todas entre la superficie de algunas la inflaría.
  let pobPareada = 0;
  let supPareada = 0;
  for (const fila of filas) {
    if (typeof fila.superficie_km2 === "number") {
      sup += fila.superficie_km2;
      supN += 1;
      if (typeof fila.poblacion_total === "number") {
        pobPareada += fila.poblacion_total;
        supPareada += fila.superficie_km2;
      }
    }
  }

  const superficie = supN === 0 ? null : sup;
  valores.densidad_hab_km2 = calcularDensidad(pobPareada, supPareada);
  // La tasa nacional es el promedio simple de las entidades, así que el tiempo de
  // duplicación que sale de ella también es aproximado.
  valores.tiempo_duplicacion_anios = calcularDuplicacion(valores.crecimiento_anual_pct);

  return {
    valores,
    superficie_km2: superficie,
    n: filas.length,
  };
}
