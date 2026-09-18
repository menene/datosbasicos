import { useQueries, useQuery } from "@tanstack/react-query";
import type { Departamento, DepartamentoDetail, IndicadorResumen, VariableKey } from "@/types/departamento";
import { completarDepartamento } from "@/lib/derivados";

export interface DepartamentosPorAnio {
  anio: number;
  data: Departamento[];
}

export interface DepartamentoPorAnio {
  anio: number;
  data: DepartamentoDetail | undefined;
}

export interface ResumenPorAnio {
  anio: number;
  data: IndicadorResumen[];
}

const API = import.meta.env.VITE_API_URL || "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// Densidad y tiempo de duplicación se derivan aquí, en la puerta de entrada de los
// datos, para que todas las vistas trabajen con ellos ya resueltos (ver lib/derivados).
async function fetchLista(url: string): Promise<Departamento[]> {
  return (await fetchJson<Departamento[]>(url)).map(completarDepartamento);
}

async function fetchDetalle(url: string): Promise<DepartamentoDetail> {
  return completarDepartamento(await fetchJson<DepartamentoDetail>(url));
}

interface ListParams {
  region?: string | null;
  orden?: VariableKey | null;
  dir?: "asc" | "desc";
  anio?: number;
}

export function useDepartamentos(params: ListParams = {}) {
  const { region, orden, dir = "asc", anio = 2025 } = params;
  const qs = new URLSearchParams();
  if (region) qs.set("region", region);
  if (orden) qs.set("orden", orden);
  qs.set("dir", dir);
  qs.set("anio", String(anio));

  return useQuery({
    queryKey: ["departamentos", params],
    queryFn: () => fetchLista(`${API}/departamentos?${qs}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartamento(slug: string | null, anio = 2025) {
  return useQuery({
    queryKey: ["departamento", slug, anio],
    queryFn: () => fetchDetalle(`${API}/departamentos/${slug}?anio=${anio}`),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useResumenIndicadores(anio = 2025) {
  return useQuery({
    queryKey: ["indicadores-resumen", anio],
    queryFn: () => fetchJson<IndicadorResumen[]>(`${API}/indicadores/resumen?anio=${anio}`),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Multi-year variants ─────────────────────────────────────────────────────

export function useDepartamentosMulti(
  anios: number[],
  extra: Omit<ListParams, "anio"> = {}
) {
  const { region, orden, dir = "asc" } = extra;
  return useQueries({
    queries: anios.map((anio) => {
      const qs = new URLSearchParams();
      if (region) qs.set("region", region);
      if (orden) qs.set("orden", orden);
      qs.set("dir", dir);
      qs.set("anio", String(anio));
      return {
        queryKey: ["departamentos", { region, orden, dir, anio }],
        queryFn: () => fetchLista(`${API}/departamentos?${qs}`),
        staleTime: 5 * 60 * 1000,
      };
    }),
    combine: (results) => ({
      data: results.map((r, i) => ({
        anio: anios[i],
        data: r.data ?? [],
      })) as DepartamentosPorAnio[],
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}

export function useDepartamentoMulti(slug: string | null, anios: number[]) {
  return useQueries({
    queries: anios.map((anio) => ({
      queryKey: ["departamento", slug, anio],
      queryFn: () => fetchDetalle(`${API}/departamentos/${slug}?anio=${anio}`),
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
    })),
    combine: (results) => ({
      data: results.map((r, i) => ({
        anio: anios[i],
        data: r.data,
      })) as DepartamentoPorAnio[],
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}

export function useResumenIndicadoresMulti(anios: number[]) {
  return useQueries({
    queries: anios.map((anio) => ({
      queryKey: ["indicadores-resumen", anio],
      queryFn: () =>
        fetchJson<IndicadorResumen[]>(`${API}/indicadores/resumen?anio=${anio}`),
      staleTime: 10 * 60 * 1000,
    })),
    combine: (results) => ({
      data: results.map((r, i) => ({
        anio: anios[i],
        data: r.data ?? [],
      })) as ResumenPorAnio[],
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });
}
