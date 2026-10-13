import { useQuery } from "@tanstack/react-query";
import type { Rio } from "@/types/rio";

const API = import.meta.env.VITE_API_URL || "/api/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useRios() {
  return useQuery({
    queryKey: ["rios"],
    queryFn: () => fetchJson<Rio[]>(`${API}/rios`),
    staleTime: Infinity,
  });
}

/** Los ríos cuya cuenca toca el departamento, en el orden del archivo (por vertiente). */
export function useRiosDeDepartamento(departamentoSlug: string | null | undefined) {
  const { data, ...rest } = useRios();
  return {
    ...rest,
    data: departamentoSlug
      ? data?.filter((r) => r.departamentos.includes(departamentoSlug))
      : undefined,
  };
}
