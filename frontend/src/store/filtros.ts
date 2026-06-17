import { create } from "zustand";
import type { VariableKey } from "@/types/departamento";

export const ANIOS_DISPONIBLES = [2005, 2025] as const;
export const ANIO_PREDETERMINADO = 2025;

interface FiltrosStore {
  variableActiva: VariableKey;
  region: string | null;
  busqueda: string;
  anio: number;
  setVariable: (v: VariableKey) => void;
  setRegion: (r: string | null) => void;
  setBusqueda: (b: string) => void;
  setAnio: (a: number) => void;
}

export const useFiltros = create<FiltrosStore>((set) => ({
  variableActiva: "poblacion_total",
  region: null,
  busqueda: "",
  anio: ANIO_PREDETERMINADO,

  setVariable: (v) => set({ variableActiva: v }),
  setRegion: (r) => set({ region: r }),
  setBusqueda: (b) => set({ busqueda: b }),
  setAnio: (a) => set({ anio: a }),
}));
