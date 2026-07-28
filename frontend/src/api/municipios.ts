import { useQuery } from "@tanstack/react-query";
import type { Municipio } from "@/types/municipio";
import type { VariableKey } from "@/types/departamento";

const API = import.meta.env.VITE_API_URL || "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useMunicipio(slug: string | null) {
  return useQuery({
    queryKey: ["municipio", slug],
    queryFn: () => fetchJson<Municipio>(`${API}/municipios/${slug}`),
    enabled: !!slug,
    staleTime: Infinity,
  });
}

export function useMunicipios() {
  return useQuery({
    queryKey: ["municipios"],
    queryFn: () => fetchJson<Municipio[]>(`${API}/municipios`),
    staleTime: Infinity,
  });
}

// [min, max] of a variable across municipios, or null if none have data for it.
export function municipiosDominio(
  municipios: Municipio[] | undefined,
  key: VariableKey
): [number, number] | null {
  if (!municipios?.length) return null;
  const vals: number[] = [];
  for (const m of municipios) {
    const v = (m as unknown as Record<string, unknown>)[key];
    if (typeof v === "number") vals.push(v);
  }
  if (!vals.length) return null;
  return [Math.min(...vals), Math.max(...vals)];
}
