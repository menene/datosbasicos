import { X, MapPin, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useDepartamento } from "@/api/departamentos";
import { useFiltros } from "@/store/filtros";
import { useSeleccion } from "@/store/seleccion";
import { formatearValor } from "@/lib/utils";
import type { Indicadores } from "@/types/departamento";

const KPIS: Array<{
  key: string;
  label: string;
  formato: "numero" | "decimal" | "porcentaje";
  unit?: string;
}> = [
  { key: "poblacion_total", label: "Población", formato: "numero" },
  { key: "densidad_hab_km2", label: "Densidad", formato: "decimal", unit: "hab/km²" },
  { key: "pct_urbana", label: "Urbana", formato: "porcentaje" },
  { key: "pct_indigena", label: "Indígena", formato: "porcentaje" },
  { key: "esperanza_vida", label: "Esp. de vida", formato: "decimal", unit: "años" },
  { key: "analfabetismo_pct", label: "Analfabetismo", formato: "porcentaje" },
  { key: "acceso_agua_pct", label: "Acceso agua", formato: "porcentaje" },
  { key: "fecundidad", label: "Fecundidad", formato: "decimal" },
];

function KpiCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-muted/50 rounded-md px-3 py-2.5">
      <p className="text-xs text-muted-foreground font-body mb-0.5">{label}</p>
      <p className="font-display font-semibold text-foreground text-base leading-tight">
        {value}
        {unit && <span className="text-xs font-body font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-5 bg-muted rounded w-2/3" />
      <div className="h-3 bg-muted rounded w-1/3" />
      <div className="grid grid-cols-2 gap-2 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-md" />
        ))}
      </div>
    </div>
  );
}

export default function PanelDepartamento() {
  const { departamentoActivo, setDepartamentoActivo } = useSeleccion();
  const { anio } = useFiltros();
  const { data: depto, isLoading } = useDepartamento(departamentoActivo, anio);

  if (!departamentoActivo) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto border-t border-border"
    >
      {isLoading || !depto ? (
        <Skeleton />
      ) : (
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display font-semibold text-foreground text-lg leading-tight">
                {depto.nombre}
              </h2>
              {depto.region && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body mt-0.5">
                  <MapPin size={11} />
                  {depto.region}
                </span>
              )}
            </div>
            <button
              onClick={() => setDepartamentoActivo(null)}
              className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Superficie */}
          {depto.superficie_km2 && (
            <p className="text-xs text-muted-foreground font-body">
              Superficie:{" "}
              <span className="font-medium text-foreground">
                {new Intl.NumberFormat("es-GT").format(depto.superficie_km2)} km²
              </span>
            </p>
          )}

          {/* KPI grid */}
          {depto.indicadores && (
            <div className="grid grid-cols-2 gap-2">
              {KPIS.map(({ key, label, formato, unit }) => {
                const raw = depto.indicadores?.[key as keyof Indicadores];
                const valor = formatearValor(typeof raw === "number" ? raw : null, formato);
                return <KpiCard key={key} label={label} value={valor} unit={unit} />;
              })}
            </div>
          )}

          {/* Descripción */}
          {depto.descripcion && (
            <p className="text-xs text-muted-foreground font-body leading-relaxed border-t border-border pt-3">
              {depto.descripcion}
            </p>
          )}

          {/* Link to ficha */}
          <Link
            to={`/ficha/${depto.slug}`}
            className="flex items-center gap-1.5 text-xs font-medium text-selva hover:text-selva-light transition-colors border-t border-border pt-3"
          >
            Ver ficha completa
            <ExternalLink size={11} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
