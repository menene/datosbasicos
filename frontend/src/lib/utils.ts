import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Indicadores, Variable } from "@/types/departamento";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatearValor(valor: number | null, formato: Variable["formato"]): string {
  if (valor === null || valor === undefined) return "—";
  switch (formato) {
    case "numero":
      return new Intl.NumberFormat("es-GT").format(valor);
    case "decimal":
      return new Intl.NumberFormat("es-GT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor);
    case "porcentaje":
      return `${new Intl.NumberFormat("es-GT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valor)}%`;
  }
}

export function getValorIndicador(indicadores: Indicadores | null, key: keyof Indicadores): number | null {
  if (!indicadores) return null;
  const val = indicadores[key];
  return typeof val === "number" ? val : null;
}
