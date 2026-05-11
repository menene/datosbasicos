import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ArrowLeft, MapPin } from "lucide-react";
import { useDepartamento, useDepartamentos, useResumenIndicadores } from "@/api/departamentos";
import { formatearValor } from "@/lib/utils";
import { VARIABLES, VARIABLES_ALERTA } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";

const ANIO = 2025;

function KpiCard({
  label,
  value,
  unit,
  isAlert,
}: {
  label: string;
  value: string;
  unit?: string;
  isAlert?: boolean;
}) {
  return (
    <div className={`rounded-lg px-4 py-3 border ${isAlert ? "bg-red-50 border-red-100" : "bg-muted/40 border-border"}`}>
      <p className="text-xs text-muted-foreground font-body mb-1">{label}</p>
      <p className={`font-display font-semibold text-lg leading-tight ${isAlert ? "text-red-700" : "text-foreground"}`}>
        {value}
        {unit && <span className="text-xs font-body font-normal text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );
}

const KPIS: Array<{ key: VariableKey; label: string; formato: "numero" | "decimal" | "porcentaje"; unit?: string }> = [
  { key: "poblacion_total", label: "Población total", formato: "numero" },
  { key: "densidad_hab_km2", label: "Densidad", formato: "decimal", unit: "hab/km²" },
  { key: "pct_urbana", label: "Población urbana", formato: "porcentaje" },
  { key: "pct_rural", label: "Población rural", formato: "porcentaje" },
  { key: "pct_indigena", label: "Población indígena", formato: "porcentaje" },
  { key: "pct_hombres", label: "Hombres", formato: "porcentaje" },
  { key: "pct_mujeres", label: "Mujeres", formato: "porcentaje" },
  { key: "esperanza_vida", label: "Esperanza de vida", formato: "decimal", unit: "años" },
  { key: "analfabetismo_pct", label: "Analfabetismo", formato: "porcentaje" },
  { key: "acceso_agua_pct", label: "Acceso a agua", formato: "porcentaje" },
  { key: "acceso_saneamiento_pct", label: "Acceso a saneamiento", formato: "porcentaje" },
  { key: "fecundidad", label: "Tasa de fecundidad", formato: "decimal" },
  { key: "crecimiento_anual_pct", label: "Crecimiento anual", formato: "porcentaje" },
  { key: "idh_ranking", label: "Ranking IDH", formato: "numero" },
];

interface ChartEntry {
  label: string;
  valor: number;
  promedio: number;
  isAlert: boolean;
}

export default function FichaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: depto, isLoading, isError } = useDepartamento(slug ?? null, ANIO);
  const { data: resumen } = useResumenIndicadores(ANIO);
  const { data: todos } = useDepartamentos({ anio: ANIO });

  // Chart: only percentage/decimal variables (not raw numbers like population)
  const chartData: ChartEntry[] = VARIABLES.filter(
    (v) => v.formato === "porcentaje"
  ).flatMap((v) => {
    const raw = depto?.indicadores?.[v.key];
    if (typeof raw !== "number") return [];
    const r = resumen?.find((r) => r.campo === v.key);
    if (!r || r.promedio === null) return [];
    return [{
      label: v.label.replace(" (%)", "").replace("Población ", "Pob. "),
      valor: Math.round(raw * 100) / 100,
      promedio: Math.round(r.promedio * 100) / 100,
      isAlert: VARIABLES_ALERTA.includes(v.key),
    }];
  });

  // Department selector
  const deptOptions = todos?.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (!slug) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-2xl text-foreground mb-6">
          Ficha departamental
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Selecciona un departamento:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-w-2xl">
          {deptOptions?.map((d) => (
            <button
              key={d.slug}
              onClick={() => navigate(`/ficha/${d.slug}`)}
              className="text-left px-3 py-2 rounded-md border border-border text-sm font-body hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
            >
              {d.nombre}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !depto) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <p className="text-sm text-muted-foreground font-body">Departamento no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
      >
        <ArrowLeft size={14} />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display font-semibold text-3xl text-foreground leading-tight">
          {depto.nombre}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mt-1">
          {depto.region && (
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {depto.region}
            </span>
          )}
          {depto.superficie_km2 && (
            <span>
              {new Intl.NumberFormat("es-GT").format(depto.superficie_km2)} km²
            </span>
          )}
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            Datos {ANIO}
          </span>
        </div>
        {depto.descripcion && (
          <p className="text-sm text-muted-foreground font-body mt-3 leading-relaxed max-w-2xl border-l-2 border-border pl-3">
            {depto.descripcion}
          </p>
        )}
      </div>

      {/* KPI grid */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Indicadores
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {KPIS.map(({ key, label, formato, unit }) => {
            const raw = depto.indicadores?.[key];
            return (
              <KpiCard
                key={key}
                label={label}
                value={formatearValor(typeof raw === "number" ? raw : null, formato)}
                unit={unit}
                isAlert={VARIABLES_ALERTA.includes(key)}
              />
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-1">
            Comparación con promedio nacional
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Variables en porcentaje · verde = {depto.nombre} · gris = promedio nacional
          </p>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 560 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 56 }}
                  barCategoryGap="25%"
                  barGap={2}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    width={36}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString("es-GT", { maximumFractionDigits: 2 })}%`,
                      name === "valor" ? depto.nombre : "Promedio nacional",
                    ]}
                    contentStyle={{ fontSize: 12, fontFamily: "inherit" }}
                  />
                  <Legend
                    formatter={(value) => value === "valor" ? depto.nombre : "Promedio nacional"}
                    wrapperStyle={{ fontSize: 12, fontFamily: "inherit", paddingTop: 8 }}
                  />
                  <Bar dataKey="valor" fill="#1B6B3A" fillOpacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="promedio" fill="#94a3b8" fillOpacity={0.6} radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Department nav */}
      {deptOptions && (
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground font-body mb-3">Otros departamentos</p>
          <div className="flex flex-wrap gap-2">
            {deptOptions.map((d) => (
              <button
                key={d.slug}
                onClick={() => navigate(`/ficha/${d.slug}`)}
                className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
                  d.slug === slug
                    ? "bg-selva text-white border-selva"
                    : "border-border text-muted-foreground hover:border-selva hover:text-selva"
                }`}
              >
                {d.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
