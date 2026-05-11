import * as d3 from "d3";
import type { VariableKey } from "@/types/departamento";

const SQRT_VARS: VariableKey[] = ["poblacion_total", "densidad_hab_km2"];
const ALERT_VARS: VariableKey[] = ["analfabetismo_pct"];

export const COLOR_SIN_DATO = "#E0D8CC";
export const COLOR_SELECCIONADO = "#E8C547";

export function getColorForValue(
  variableKey: VariableKey,
  value: number,
  min: number,
  max: number
): string {
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
