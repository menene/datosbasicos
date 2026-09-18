import { useQuery } from "@tanstack/react-query";
import type { Lago } from "@/types/lago";

const API = import.meta.env.VITE_API_URL || "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useLagos() {
  return useQuery({
    queryKey: ["lagos"],
    queryFn: () => fetchJson<Lago[]>(`${API}/lagos`),
    staleTime: Infinity,
  });
}

/** El lago del departamento, si tiene uno (Sololá, Guatemala, Petén, Izabal). */
export function useLagoDeDepartamento(departamentoSlug: string | null | undefined) {
  const { data, ...rest } = useLagos();
  return {
    ...rest,
    data: departamentoSlug
      ? data?.find((l) => l.departamento_slug === departamentoSlug)
      : undefined,
  };
}

/** Un lago por su slug; la ficha de sitio la usa para el informe completo. */
export function useLago(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["lago", slug],
    queryFn: () => fetchJson<Lago>(`${API}/lagos/${slug}`),
    enabled: !!slug,
    staleTime: Infinity,
  });
}
