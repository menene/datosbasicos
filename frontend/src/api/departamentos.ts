import { useQuery } from "@tanstack/react-query";
import type { Departamento, DepartamentoDetail, IndicadorResumen, VariableKey } from "@/types/departamento";

const API = import.meta.env.VITE_API_URL ?? "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
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
    queryFn: () => fetchJson<Departamento[]>(`${API}/departamentos?${qs}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartamento(slug: string | null, anio = 2025) {
  return useQuery({
    queryKey: ["departamento", slug, anio],
    queryFn: () => fetchJson<DepartamentoDetail>(`${API}/departamentos/${slug}?anio=${anio}`),
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
