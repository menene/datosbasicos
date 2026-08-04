import { VARIABLES } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";

/**
 * National aggregation for Guatemala.
 *
 * Indicators fall into three classes:
 *  - Additive  → summed across entities (población, superficie, PEA…).
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
    if (CLAVES_SIN_TOTAL.has(key)) {
      valores[key] = null;
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
  for (const fila of filas) {
    if (typeof fila.superficie_km2 === "number") {
      sup += fila.superficie_km2;
      supN += 1;
    }
  }

  return {
    valores,
    superficie_km2: supN === 0 ? null : sup,
    n: filas.length,
  };
}
