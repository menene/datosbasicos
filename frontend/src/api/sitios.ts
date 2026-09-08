import { useQuery } from "@tanstack/react-query";
import type { Sitio } from "@/types/sitio";

const API = import.meta.env.VITE_API_URL || "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useSitios() {
  return useQuery({
    queryKey: ["sitios"],
    queryFn: () => fetchJson<Sitio[]>(`${API}/sitios`),
    staleTime: Infinity,
  });
}

/** Los sitios de un departamento, en el orden del archivo. */
export function useSitiosDeDepartamento(departamentoSlug: string | null | undefined) {
  const { data, ...rest } = useSitios();
  return {
    ...rest,
    data: departamentoSlug
      ? data?.filter((s) => s.departamento_slug === departamentoSlug)
      : undefined,
  };
}

export function useSitio(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["sitio", slug],
    queryFn: () => fetchJson<Sitio>(`${API}/sitios/${slug}`),
    enabled: !!slug,
    staleTime: Infinity,
  });
}
