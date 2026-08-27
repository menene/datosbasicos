/**
 * Indicadores derivados: densidad poblacional y tiempo de duplicación.
 *
 *   densidad_hab_km2         = población total / extensión territorial (km²)
 *   tiempo_duplicacion_anios = 70 / tasa de crecimiento anual (%)   [regla del 70]
 *
 * Los dos son cocientes de otros indicadores, así que se calculan en vez de
 * depender de que el documento fuente los trajera. La misma política vive en
 * `backend/app/seed/derivados.py`, que la aplica al generar los JSON; esto la
 * repite sobre lo que llega por API para que valga en todas las vistas —tabla,
 * mapa, ficha, gráficas, panel y exportación— incluida la fila de total nacional,
 * que no sale de ningún documento.
 *
 * Política:
 *  1. Falta el valor y hay insumos → se calcula.
 *  2. El valor existe pero contradice a la fórmula por más de 1.5x → gana la fórmula.
 *  3. No hay insumos → se conserva el valor publicado.
 */
import type { Departamento, Indicadores } from "@/types/departamento";
import type { Municipio } from "@/types/municipio";

/** Regla del 70: con r = 2.00 % anual, 70 / 2.00 = 35 años. */
export const CONSTANTE_DUPLICACION = 70;

const TOLERANCIA = 0.5;

export function calcularDensidad(
  poblacion: number | null | undefined,
  superficie: number | null | undefined
): number | null {
  if (!poblacion || !superficie || superficie <= 0) return null;
  return Math.round((poblacion / superficie) * 100) / 100;
}

export function calcularDuplicacion(tasa: number | null | undefined): number | null {
  if (!tasa || tasa <= 0) return null;
  return Math.round((CONSTANTE_DUPLICACION / tasa) * 100) / 100;
}

function resolver(publicado: number | null, calculado: number | null): number | null {
  if (calculado === null) return publicado;
  if (publicado === null) return calculado;
  const mayor = Math.max(publicado, calculado);
  const menor = Math.min(publicado, calculado);
  return menor <= 0 || mayor / menor > 1 + TOLERANCIA ? calculado : publicado;
}

const num = (v: unknown): number | null => (typeof v === "number" ? v : null);

/** Aplica ambas fórmulas a un registro con campos de indicador. */
export function completarDerivados<T extends Record<string, unknown>>(
  registro: T,
  superficie: number | null
): T {
  const densidad = resolver(
    num(registro.densidad_hab_km2),
    calcularDensidad(num(registro.poblacion_total), superficie)
  );
  const duplicacion = resolver(
    num(registro.tiempo_duplicacion_anios),
    calcularDuplicacion(num(registro.crecimiento_anual_pct))
  );
  if (
    densidad === num(registro.densidad_hab_km2) &&
    duplicacion === num(registro.tiempo_duplicacion_anios)
  ) {
    return registro;
  }
  return { ...registro, densidad_hab_km2: densidad, tiempo_duplicacion_anios: duplicacion };
}

/** La extensión del departamento vive fuera del corte anual, no en los indicadores. */
export function completarDepartamento<T extends Departamento>(depto: T): T {
  if (!depto?.indicadores) return depto;
  const indicadores = completarDerivados(
    depto.indicadores as unknown as Record<string, unknown>,
    depto.superficie_km2
  ) as unknown as Indicadores;
  return indicadores === depto.indicadores ? depto : { ...depto, indicadores };
}

export function completarMunicipio(muni: Municipio): Municipio {
  if (!muni) return muni;
  return completarDerivados(
    muni as unknown as Record<string, unknown>,
    muni.superficie_km2
  ) as unknown as Municipio;
}
