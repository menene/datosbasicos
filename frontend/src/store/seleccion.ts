import { create } from "zustand";

interface SeleccionStore {
  departamentoActivo: string | null;
  departamentosComparar: string[];
  setDepartamentoActivo: (slug: string | null) => void;
  toggleComparar: (slug: string) => void;
  clearComparar: () => void;
}

export const useSeleccion = create<SeleccionStore>((set, get) => ({
  departamentoActivo: null,
  departamentosComparar: [],

  setDepartamentoActivo: (slug) => set({ departamentoActivo: slug }),

  toggleComparar: (slug) => {
    const { departamentosComparar } = get();
    if (departamentosComparar.includes(slug)) {
      set({ departamentosComparar: departamentosComparar.filter((s) => s !== slug) });
    } else if (departamentosComparar.length < 2) {
      set({ departamentosComparar: [...departamentosComparar, slug] });
    }
  },

  clearComparar: () => set({ departamentosComparar: [] }),
}));
