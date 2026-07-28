import { useMemo } from "react";
import { slugify } from "@/lib/mapa";

function ringsOf(feature: GeoJSON.Feature): number[][][] | null {
  const g = feature.geometry;
  if (!g) return null;
  if (g.type === "Polygon") return g.coordinates as number[][][];
  if (g.type === "MultiPolygon") return (g.coordinates as number[][][][]).flat();
  return null;
}

function bboxOf(rings: number[][][]): [number, number, number, number] {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of rings) {
    for (const [lon, lat] of ring as [number, number][]) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return [minLon, minLat, maxLon, maxLat];
}

function nameOf(feature: GeoJSON.Feature): string {
  const props = (feature.properties ?? {}) as Record<string, string>;
  return props["shapeName"] ?? props["NAME_2"] ?? props["NAME_1"] ?? props["name"] ?? "";
}

interface Props {
  /** GeoJSON features to search (already scoped, e.g. municipios of one department). */
  features: GeoJSON.Feature[] | undefined;
  /** Slug of the region whose silhouette to render (matched against feature name). */
  slug: string;
  size?: number;
  className?: string;
  isLoading?: boolean;
  ariaLabel?: string;
}

/**
 * Renders the silhouette of a single geographic region as an SVG path, fitted into
 * a square via a simple equirectangular projection. Shared by the departamento and
 * municipio fichas — pass the appropriate GeoJSON feature list.
 */
export default function RegionShape({
  features,
  slug,
  size = 220,
  className,
  isLoading = false,
  ariaLabel = "Silueta de la región",
}: Props) {
  const pathD = useMemo(() => {
    if (!features) return null;
    const feature = features.find((f) => slugify(nameOf(f)) === slug);
    if (!feature) return null;

    const rings = ringsOf(feature);
    if (!rings || rings.length === 0) return null;

    const [minLon, minLat, maxLon, maxLat] = bboxOf(rings);
    const PAD = 12;
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    if (lonRange === 0 || latRange === 0) return null;

    const inner = size - 2 * PAD;
    const scale = inner / Math.max(lonRange, latRange);
    const offsetX = PAD + (inner - lonRange * scale) / 2;
    const offsetY = PAD + (inner - latRange * scale) / 2;

    const project = (lon: number, lat: number): [number, number] => [
      offsetX + (lon - minLon) * scale,
      offsetY + (maxLat - lat) * scale,
    ];

    return rings
      .map((ring) => {
        const pts = (ring as [number, number][]).map(([lon, lat]) => project(lon, lat));
        return "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") + "Z";
      })
      .join(" ");
  }, [features, slug, size]);

  if (isLoading) {
    return <div className={className} style={{ width: size, height: size }} aria-hidden />;
  }

  if (!pathD) return null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      <path
        d={pathD}
        fill="#1B6B3A"
        fillOpacity={0.12}
        stroke="#1B6B3A"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}
