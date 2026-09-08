import { create } from "zustand";

interface SeleccionStore {
  departamentoActivo: string | null;
  municipioActivo: string | null;
  /** Department of `municipioActivo`; some municipio slugs repeat across departments. */
  municipioDeptActivo: string | null;
  /** Lago seleccionado en el mapa (los lagos son polígonos aparte, no municipios). */
  lagoActivo: string | null;
  departamentosComparar: string[];
  setDepartamentoActivo: (slug: string | null) => void;
  setMunicipioActivo: (slug: string | null, departamentoSlug?: string | null) => void;
  setLagoActivo: (slug: string | null) => void;
  toggleComparar: (slug: string) => void;
  clearComparar: () => void;
}

export const useSeleccion = create<SeleccionStore>((set, get) => ({
  departamentoActivo: null,
  municipioActivo: null,
  municipioDeptActivo: null,
  lagoActivo: null,
  departamentosComparar: [],

  setDepartamentoActivo: (slug) =>
    set({ departamentoActivo: slug, lagoActivo: slug ? null : get().lagoActivo }),

  // Municipio y lago comparten el panel lateral del mapa: elegir uno cierra el otro.
  setMunicipioActivo: (slug, departamentoSlug = null) =>
    set({
      municipioActivo: slug,
      municipioDeptActivo: slug ? departamentoSlug : null,
      lagoActivo: slug ? null : get().lagoActivo,
    }),

  setLagoActivo: (slug) =>
    set(
      slug
        ? {
            lagoActivo: slug,
            municipioActivo: null,
            municipioDeptActivo: null,
            departamentoActivo: null,
          }
        : { lagoActivo: null }
    ),

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
