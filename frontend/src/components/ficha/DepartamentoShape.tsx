import { useMemo } from "react";
import { useGeoData } from "@/api/geo";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

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

interface Props {
  slug: string;
  size?: number;
  className?: string;
}

export default function DepartamentoShape({ slug, size = 220, className }: Props) {
  const { data: geoData, isLoading } = useGeoData();

  const pathD = useMemo(() => {
    if (!geoData) return null;
    const feature = geoData.features.find((f) => {
      const props = f.properties ?? {};
      const name: string =
        (props as Record<string, string>)["shapeName"] ??
        (props as Record<string, string>)["NAME_1"] ??
        (props as Record<string, string>)["name"] ??
        "";
      return slugify(name) === slug;
    });
    if (!feature) return null;

    const rings = ringsOf(feature);
    if (!rings || rings.length === 0) return null;

    const [minLon, minLat, maxLon, maxLat] = bboxOf(rings);
    const PAD = 12;
    const lonRange = maxLon - minLon;
    const latRange = maxLat - minLat;
    if (lonRange === 0 || latRange === 0) return null;

    // Fit the bbox into a (size - 2*PAD) square, preserving aspect ratio
    // Latitude has ~1.03x more degrees-to-km than longitude at Guatemala's latitude (~15°N),
    // but for a silhouette this is close enough. Scale uniformly by the larger range.
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
        const pts = (ring as [number, number][]).map(([lon, lat]) =>
          project(lon, lat)
        );
        return (
          "M" +
          pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") +
          "Z"
        );
      })
      .join(" ");
  }, [geoData, slug, size]);

  if (isLoading) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  if (!pathD) return null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Silueta del departamento"
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
