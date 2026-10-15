import * as d3 from "d3";
import type { VariableKey } from "@/types/departamento";

const SQRT_VARS: VariableKey[] = ["poblacion_total", "densidad_hab_km2"];
const ALERT_VARS: VariableKey[] = [
  "analfabetismo_pct",
  // Vulnerabilidad: mayor valor = peor, como el analfabetismo.
  "vulnerabilidad_social",
  "vuln_sociodemografica",
  "vuln_educacion",
  "vuln_empleo",
  "vuln_vivienda",
  "vuln_servicios",
  "vuln_equipamiento",
];

/**
 * Índice de vulnerabilidad por niveles: los cinco colores de la leyenda de la
 * Figura 3 de Tercero et al. (Clavius 2023), «Índice de vulnerabilidad municipal
 * según suma ponderada de datos», muestreados de la figura. No es una rampa: cada
 * nivel tiene su color, y el campo numérico es el orden del nivel (1 = muy bajo).
 */
export const NIVELES_VULNERABILIDAD = [
  { categoria: "muy baja", etiqueta: "Muy bajo", color: "#6CB52E" },
  { categoria: "baja", etiqueta: "Bajo", color: "#9B9B9B" },
  { categoria: "media", etiqueta: "Medio", color: "#323232" },
  { categoria: "alta", etiqueta: "Alto", color: "#E43D3C" },
  { categoria: "muy alta", etiqueta: "Muy alto", color: "#BD4341" },
] as const;

/** Nivel 1–5 → su entrada en NIVELES_VULNERABILIDAD. */
export const nivelVulnerabilidad = (nivel: number) => NIVELES_VULNERABILIDAD[nivel - 1];

export const COLOR_SIN_DATO = "#E0D8CC";
export const COLOR_SELECCIONADO = "#E8C547";

export function getColorForValue(
  variableKey: VariableKey,
  value: number,
  min: number,
  max: number
): string {
  if (variableKey === "vulnerabilidad_nivel") {
    return nivelVulnerabilidad(value)?.color ?? COLOR_SIN_DATO;
  }
  const isAlerta = ALERT_VARS.includes(variableKey);
  const startColor = isAlerta ? "#FAE0CC" : "#D6ECD8";
  const endColor = isAlerta ? "#8B2500" : "#1B6B3A";
  const interpolate = d3.interpolateRgb(startColor, endColor);
  if (max === min) return interpolate(0.5);
  const t = (value - min) / (max - min);
  const tClamped = Math.max(0, Math.min(1, SQRT_VARS.includes(variableKey) ? Math.sqrt(t) : t));
  return interpolate(tClamped);
}

// Used only for the legend gradient swatches
export function getEscala(variableKey: VariableKey, dominio: [number, number]) {
  const [min, max] = dominio;
  return (value: number) => getColorForValue(variableKey, value, min, max);
}

// Legacy exports kept for LeyendaColor compatibility
export const escalaPositiva = (dominio: [number, number]) =>
  d3.scaleSequential(dominio, d3.interpolateRgb("#D6ECD8", "#1B6B3A")).clamp(true);

export const escalaAlerta = (dominio: [number, number]) =>
  d3.scaleSequential(dominio, d3.interpolateRgb("#FAE0CC", "#8B2500")).clamp(true);
