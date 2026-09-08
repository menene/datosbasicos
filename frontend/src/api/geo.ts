import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL || "/api/v1";

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

export function useGeoMunicipios() {
  return useQuery({
    queryKey: ["geo-municipios"],
    queryFn: async () => {
      const res = await fetch(`${API}/geo/municipios`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<GeoJSON.FeatureCollection>;
    },
    staleTime: Infinity,
  });
}

/** Solo los polígonos de lago. El mapa departamental los dibuja encima: en Petén el
 *  polígono del departamento cubre el lago con tierra, así que no se vería. */
export function useGeoLagos() {
  return useQuery({
    queryKey: ["geo-lagos"],
    queryFn: async () => {
      const res = await fetch(`${API}/geo/lagos`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json() as Promise<GeoJSON.FeatureCollection>;
    },
    staleTime: Infinity,
  });
}
