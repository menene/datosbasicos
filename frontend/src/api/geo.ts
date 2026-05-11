import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "/api/v1";

export function useGeoData() {
  return useQuery({
    queryKey: ["geo-departamentos"],
    queryFn: async () => {
      const res = await fetch(`${API}/geo/departamentos`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<GeoJSON.FeatureCollection>;
    },
    staleTime: Infinity,
  });
}
