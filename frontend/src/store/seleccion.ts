import { create } from "zustand";

interface SeleccionStore {
  departamentoActivo: string | null;
  municipioActivo: string | null;
  /** Department of `municipioActivo`; some municipio slugs repeat across departments. */
  municipioDeptActivo: string | null;
  departamentosComparar: string[];
  setDepartamentoActivo: (slug: string | null) => void;
  setMunicipioActivo: (slug: string | null, departamentoSlug?: string | null) => void;
  toggleComparar: (slug: string) => void;
  clearComparar: () => void;
}

export const useSeleccion = create<SeleccionStore>((set, get) => ({
  departamentoActivo: null,
  municipioActivo: null,
  municipioDeptActivo: null,
  departamentosComparar: [],

  setDepartamentoActivo: (slug) => set({ departamentoActivo: slug }),

  setMunicipioActivo: (slug, departamentoSlug = null) =>
    set({ municipioActivo: slug, municipioDeptActivo: slug ? departamentoSlug : null }),

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
