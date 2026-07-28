// Shared cartographic helpers for the choropleth maps (departamentos + municipios).
// A simple equirectangular projection over Guatemala's bounding box — bypasses
// D3 geoPath entirely, which keeps the SVG rendering fast and dependency-light.

export const MAP_W = 800;
export const MAP_H = 700;
const PAD = 20;

// Guatemala bounding box (from GADM / geoBoundaries data)
const LON_MIN = -92.23, LON_MAX = -88.23;
const LAT_MIN = 13.74, LAT_MAX = 17.82;

export function projectPt(lon: number, lat: number): [number, number] {
  const x = PAD + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (MAP_W - 2 * PAD);
  const y = PAD + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (MAP_H - 2 * PAD);
  return [x, y];
}

export function featureToSvgPath(feature: GeoJSON.Feature): string | null {
  const geom = feature.geometry;
  if (!geom) return null;
  let rings: number[][][];
  if (geom.type === "Polygon") rings = geom.coordinates as number[][][];
  else if (geom.type === "MultiPolygon") rings = (geom.coordinates as number[][][][]).flat();
  else return null;
  return rings
    .map((ring) => {
      const pts = (ring as [number, number][]).map(([lon, lat]) => projectPt(lon, lat));
      return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
    })
    .join(" ");
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
