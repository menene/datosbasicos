import { useMemo, useState } from "react";
import { useGeoMunicipios } from "@/api/geo";
import { useMunicipios, municipiosDominio } from "@/api/municipios";
import { useFiltros } from "@/store/filtros";
import { useSeleccion } from "@/store/seleccion";
import { getColorForValue, COLOR_SIN_DATO, COLOR_SELECCIONADO } from "@/lib/colores";
import { track } from "@/lib/analytics";
import { MAP_W, MAP_H, featureToSvgPath, slugify } from "@/lib/mapa";
import { VARIABLES } from "@/types/departamento";
import type { Municipio } from "@/types/municipio";
import { formatearValor } from "@/lib/utils";

interface TooltipState {
  x: number;
  y: number;
  municipio: string;
  departamento: string;
  valor: string;
}

function propsOf(feature: GeoJSON.Feature) {
  const props = feature.properties ?? {};
  const municipio: string = props["shapeName"] ?? props["NAME_2"] ?? props["name"] ?? "";
  const departamento: string = props["departamento"] ?? props["NAME_1"] ?? "";
  return { municipio, departamento };
}

export default function MapaMunicipios() {
  const { data: geoData, isLoading, isError } = useGeoMunicipios();
  const { data: municipios } = useMunicipios();
  const variableActiva = useFiltros((s) => s.variableActiva);
  const { municipioActivo, setMunicipioActivo } = useSeleccion();
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const variableInfo = VARIABLES.find((v) => v.key === variableActiva);

  const muniMap = useMemo(() => {
    const map = new Map<string, Municipio>();
    municipios?.forEach((m) => map.set(m.slug, m));
    return map;
  }, [municipios]);

  // Precompute slug → hex color for the active variable (same ramp as departamentos).
  // Municipios without a value for the variable fall back to COLOR_SIN_DATO (gray).
  const fillMap = useMemo(() => {
    const result = new Map<string, string>();
    const dominio = municipiosDominio(municipios, variableActiva);
    if (!dominio) return result;
    const [min, max] = dominio;
    for (const m of municipios ?? []) {
      const raw = (m as unknown as Record<string, unknown>)[variableActiva];
      result.set(
        m.slug,
        typeof raw === "number" ? getColorForValue(variableActiva, raw, min, max) : COLOR_SIN_DATO
      );
    }
    return result;
  }, [municipios, variableActiva]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#EAF4F0" }}>
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 border-2 border-selva border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-body">Cargando municipios…</p>
        </div>
      </div>
    );
  }

  if (isError || !geoData) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#EAF4F0" }}>
        <div className="text-center space-y-2 max-w-sm px-6">
          <p className="font-display font-semibold text-foreground text-lg">GeoJSON no disponible</p>
          <p className="text-sm text-muted-foreground font-body">
            Coloca el archivo de municipios en:
          </p>
          <code className="block text-xs bg-muted px-3 py-2 rounded text-foreground mt-1">
            backend/app/seed/data/guatemala_municipios.geojson
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
          const { municipio, departamento } = propsOf(feature);
          const deptSlug = slugify(departamento);
          const muniSlug = slugify(municipio);
          const isActive = !!muniSlug && muniSlug === municipioActivo;

          const pathD = featureToSvgPath(feature);
          if (!pathD) return null;

          const baseFill = fillMap.get(muniSlug) ?? COLOR_SIN_DATO;
          const computedFill = isActive ? COLOR_SELECCIONADO : baseFill;
          const opacity = municipioActivo && !isActive ? 0.72 : 1;

          return (
            <path
              key={`${deptSlug}-${muniSlug}-${i}`}
              d={pathD}
              fill={computedFill}
              fillOpacity={opacity}
              stroke={isActive ? "#3A2A18" : "white"}
              strokeWidth={isActive ? 1.4 : 0.5}
              strokeLinejoin="round"
              style={{ cursor: "pointer", transition: "fill 0.3s ease, fill-opacity 0.2s ease, stroke 0.2s ease" }}
              onMouseMove={(e) => {
                const container = e.currentTarget.closest(".map-container") as HTMLElement;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                const raw = (
                  muniMap.get(muniSlug) as unknown as Record<string, unknown> | undefined
                )?.[variableActiva];
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  municipio: municipio || "—",
                  departamento: departamento || "—",
                  valor: formatearValor(
                    typeof raw === "number" ? raw : null,
                    variableInfo?.formato ?? "decimal"
                  ),
                });
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => {
                const deseleccionar = muniSlug === municipioActivo;
                setMunicipioActivo(deseleccionar ? null : muniSlug);
                if (!deseleccionar) {
                  track("mapa_municipio_click", {
                    municipio: muniSlug,
                    departamento: deptSlug,
                    variable: variableActiva,
                  });
                }
              }}
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
            {tooltip.municipio}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{tooltip.departamento}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {variableInfo?.label}:{" "}
            <span className="font-medium text-foreground">{tooltip.valor}</span>
          </p>
        </div>
      )}
    </div>
  );
}
