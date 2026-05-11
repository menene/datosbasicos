import { create } from "zustand";
import type { VariableKey } from "@/types/departamento";

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
  anio: 2025,

  setVariable: (v) => set({ variableActiva: v }),
  setRegion: (r) => set({ region: r }),
  setBusqueda: (b) => set({ busqueda: b }),
  setAnio: (a) => set({ anio: a }),
}));
