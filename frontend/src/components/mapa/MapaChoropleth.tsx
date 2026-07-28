import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useGeoData } from "@/api/geo";
import { useDepartamentos, useResumenIndicadores } from "@/api/departamentos";
import { useFiltros } from "@/store/filtros";
import { useSeleccion } from "@/store/seleccion";
import { COLOR_SIN_DATO } from "@/lib/colores";
import { MAP_W, MAP_H, featureToSvgPath, slugify } from "@/lib/mapa";
import { VARIABLES } from "@/types/departamento";
import type { Departamento, VariableKey } from "@/types/departamento";
import { formatearValor } from "@/lib/utils";

// Variables where a sqrt transform gives better visual distribution
const SQRT_VARS: VariableKey[] = ["poblacion_total", "densidad_hab_km2"];

function buildScale(variableKey: VariableKey, min: number, max: number) {
  const isAlerta = variableKey === "analfabetismo_pct";
  const startColor = isAlerta ? "#FAE0CC" : "#D6ECD8";
  const endColor = isAlerta ? "#8B2500" : "#1B6B3A";
  const interpolate = d3.interpolateRgb(startColor, endColor);
  const useSqrt = SQRT_VARS.includes(variableKey);

  return (value: number): string => {
    if (max === min) return interpolate(0.5);
    const t = (value - min) / (max - min);
    const tClamped = Math.max(0, Math.min(1, useSqrt ? Math.sqrt(t) : t));
    return interpolate(tClamped);
  };
}

interface TooltipState {
  x: number;
  y: number;
  nombre: string;
  valor: string;
}

export default function MapaChoropleth() {
  const { data: geoData, isLoading: geoLoading, isError: geoError } = useGeoData();
  const variableActiva = useFiltros((s) => s.variableActiva);
  const anio = useFiltros((s) => s.anioMapa);
  const { departamentoActivo, setDepartamentoActivo } = useSeleccion();
  const { data: departamentos } = useDepartamentos({ anio });
  const { data: resumen } = useResumenIndicadores(anio);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const variableInfo = VARIABLES.find((v) => v.key === variableActiva);

  const deptoMap = useMemo(() => {
    const map = new Map<string, Departamento>();
    departamentos?.forEach((d) => map.set(d.slug, d));
    return map;
  }, [departamentos]);

  // Precompute slug → hex color. Only populated when both datasets are ready.
  const fillMap = useMemo(() => {
    const result = new Map<string, string>();
    if (!departamentos?.length || !resumen?.length) return result;

    const r = resumen.find((item) => item.campo === variableActiva);
    if (!r || r.minimo === null || r.maximo === null) return result;

    const colorFor = buildScale(variableActiva, r.minimo, r.maximo);

    for (const depto of departamentos) {
      const raw = depto.indicadores?.[variableActiva] ?? null;
      result.set(
        depto.slug,
        typeof raw === "number" ? colorFor(raw) : COLOR_SIN_DATO
      );
    }
    return result;
  }, [departamentos, resumen, variableActiva]);

  // No D3 geoPath needed — featureToSvgPath does pure equirectangular projection

  if (geoLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#EAF4F0" }}>
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-selva border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-body">Cargando mapa…</p>
        </div>
      </div>
    );
  }

  if (geoError || !geoData) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#EAF4F0" }}>
        <div className="text-center space-y-2 max-w-sm px-6">
          <p className="font-display font-semibold text-foreground text-lg">GeoJSON no disponible</p>
          <p className="text-sm text-muted-foreground font-body">
            Coloca el archivo GADM Guatemala (ADM1) en:
          </p>
          <code className="block text-xs bg-muted px-3 py-2 rounded text-foreground mt-1">
            backend/app/seed/data/guatemala.geojson
          </code>
        </div>
      </div>
    );
  }

  return (
    <div
      className="map-container flex-1 relative h-full overflow-hidden"
      style={{ background: "#D8ECF5" }}
    >
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        width="100%"
        height="100%"
        onMouseLeave={() => setTooltip(null)}
      >
        <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#D8ECF5" />
        {geoData.features.map((feature, i) => {
            const props = feature.properties ?? {};
            const name: string =
              props["shapeName"] ?? props["NAME_1"] ?? props["name"] ?? "";
            const slug = slugify(name);
            const isActive = !!slug && slug === departamentoActivo;

            const pathD = featureToSvgPath(feature);
            if (!pathD) return null;

            const baseFill = fillMap.get(slug) ?? COLOR_SIN_DATO;
            const computedFill = isActive ? "#E8C547" : baseFill;
            const opacity = departamentoActivo && !isActive ? 0.72 : 1;

            return (
              <path
                key={slug || i}
                d={pathD}
                fill={computedFill}
                fillOpacity={opacity}
                stroke="white"
                strokeWidth={isActive ? 2.5 : 1}
                strokeLinejoin="round"
                style={{ cursor: "pointer", transition: "fill 0.3s ease, fill-opacity 0.2s ease" }}
                onMouseMove={(e) => {
                  const container = e.currentTarget.closest(
                    ".map-container"
                  ) as HTMLElement;
                  if (!container) return;
                  const rect = container.getBoundingClientRect();
                  const depto = deptoMap.get(slug);
                  const rawVal = depto?.indicadores?.[variableActiva] ?? null;
                  setTooltip({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    nombre: name || slug,
                    valor: formatearValor(
                      typeof rawVal === "number" ? rawVal : null,
                      variableInfo?.formato ?? "decimal"
                    ),
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() =>
                  setDepartamentoActivo(
                    slug === departamentoActivo ? null : slug
                  )
                }
              />
            );
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute z-20 pointer-events-none bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm"
          style={{ left: tooltip.x + 14, top: Math.max(8, tooltip.y - 56) }}
        >
          <p className="font-display font-semibold text-foreground leading-tight">
            {tooltip.nombre}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {variableInfo?.label}:{" "}
            <span className="font-medium text-foreground">{tooltip.valor}</span>
          </p>
        </div>
      )}
    </div>
  );
}
