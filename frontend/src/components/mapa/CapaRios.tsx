import { useMemo, useState } from "react";
import { useGeoRios } from "@/api/geo";
import { useRios } from "@/api/rios";
import { useFiltros } from "@/store/filtros";
import { lineaToSvgPath } from "@/lib/mapa";
import type { Rio } from "@/types/rio";

export interface TooltipRio {
  x: number;
  y: number;
  nombre: string;
  valor: string;
  etiquetaValor: string;
}

const COLOR_RIO = "#2E6FB7";

/**
 * Ríos principales (rios.json + trazo de OpenStreetMap) como capa de líneas sobre
 * cualquiera de los dos mapas. Va dentro del <svg> del mapa, después de los
 * polígonos. El trazo visible es fino; debajo hay uno ancho e invisible para que
 * pasar el cursor por encima sea fácil.
 */
export default function CapaRios({ onTooltip }: { onTooltip: (t: TooltipRio | null) => void }) {
  const mostrar = useFiltros((s) => s.mostrarRios);
  const { data: geo } = useGeoRios();
  const { data: rios } = useRios();
  const [resaltado, setResaltado] = useState<string | null>(null);

  const porSlug = useMemo(() => {
    const m = new Map<string, Rio>();
    rios?.forEach((r) => m.set(r.slug, r));
    return m;
  }, [rios]);

  const trazos = useMemo(
    () =>
      (geo?.features ?? []).flatMap((f) => {
        const d = lineaToSvgPath(f);
        const slug = String(f.properties?.slug ?? "");
        return d ? [{ slug, nombre: String(f.properties?.nombre ?? slug), d }] : [];
      }),
    [geo]
  );

  if (!mostrar || trazos.length === 0) return null;

  return (
    <g>
      {trazos.map(({ slug, nombre, d }) => {
        const rio = porSlug.get(slug);
        const activo = resaltado === slug;
        return (
          <g key={slug}>
            <path
              d={d}
              fill="none"
              stroke={COLOR_RIO}
              strokeWidth={activo ? 2.6 : 1.4}
              strokeOpacity={activo ? 1 : 0.85}
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="none"
            />
            {/* Zona de cursor, más ancha que la línea visible */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={8}
              style={{ cursor: "default" }}
              onMouseMove={(e) => {
                const container = e.currentTarget.closest(".map-container") as HTMLElement;
                if (!container) return;
                const rect = container.getBoundingClientRect();
                setResaltado(slug);
                onTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  nombre: rio?.nombre ?? nombre,
                  etiquetaValor: "Vertiente",
                  valor: rio
                    ? `${rio.vertiente}${
                        rio.cuenca_km2 !== null
                          ? ` · cuenca de ${new Intl.NumberFormat("es-GT").format(rio.cuenca_km2)} km²`
                          : ""
                      }`
                    : "—",
                });
              }}
              onMouseLeave={() => {
                setResaltado(null);
                onTooltip(null);
              }}
            />
          </g>
        );
      })}
    </g>
  );
}
