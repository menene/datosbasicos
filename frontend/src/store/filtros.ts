import { create } from "zustand";
import type { VariableKey } from "@/types/departamento";

export const ANIOS_DISPONIBLES = [1994, 2005, 2025] as const;
export const ANIO_PREDETERMINADO = 2025;

interface FiltrosStore {
  variableActiva: VariableKey;
  region: string | null;
  busqueda: string;
  /** Sorted ascending. Always contains at least one year. */
  anios: number[];
  /** Single-year selection used by the Mapa page (independent of `anios`). */
  anioMapa: number;
  setVariable: (v: VariableKey) => void;
  setRegion: (r: string | null) => void;
  setBusqueda: (b: string) => void;
  setAnios: (a: number[]) => void;
  toggleAnio: (a: number) => void;
  setAnioMapa: (a: number) => void;
}

export const useFiltros = create<FiltrosStore>((set, get) => ({
  variableActiva: "poblacion_total",
  region: null,
  busqueda: "",
  anios: [ANIO_PREDETERMINADO],
  anioMapa: ANIO_PREDETERMINADO,

  setVariable: (v) => set({ variableActiva: v }),
  setRegion: (r) => set({ region: r }),
  setBusqueda: (b) => set({ busqueda: b }),
  setAnios: (a) => {
    if (a.length === 0) return;
    set({ anios: [...new Set(a)].sort((x, y) => x - y) });
  },
  toggleAnio: (a) => {
    const { anios } = get();
    const next = anios.includes(a)
      ? anios.filter((y) => y !== a)
      : [...anios, a];
    if (next.length === 0) return; // require at least one selected
    set({ anios: next.sort((x, y) => x - y) });
  },
  setAnioMapa: (a) => set({ anioMapa: a }),
}));
