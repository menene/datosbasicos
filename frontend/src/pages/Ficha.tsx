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
import {
  useDepartamentoMulti,
  useDepartamentos,
  useResumenIndicadoresMulti,
} from "@/api/departamentos";
import { useFiltros } from "@/store/filtros";
import SelectorAniosMulti from "@/components/SelectorAniosMulti";
import { formatearValor } from "@/lib/utils";
import { VARIABLES, VARIABLES_ALERTA } from "@/types/departamento";
import type { VariableKey, Indicadores } from "@/types/departamento";
import DepartamentoShape from "@/components/ficha/DepartamentoShape";

const COLORES_ANIO: Record<number, string> = {
  2005: "#8B4513",
  2025: "#1B6B3A",
};
const COLORES_PROMEDIO: Record<number, string> = {
  2005: "#D4B895",
  2025: "#94a3b8",
};
const FALLBACK_ANIO = ["#1E4D8C", "#854D0E", "#5B21B6", "#0e7490"];
const FALLBACK_PROMEDIO = ["#a5b4cb", "#d6c39a", "#c9b3e2", "#a1d0d8"];
const colorPorAnio = (anio: number, idx: number): string =>
  COLORES_ANIO[anio] ?? FALLBACK_ANIO[idx % FALLBACK_ANIO.length];
const colorPromedioPorAnio = (anio: number, idx: number): string =>
  COLORES_PROMEDIO[anio] ?? FALLBACK_PROMEDIO[idx % FALLBACK_PROMEDIO.length];

function KpiCard({
  label,
  unit,
  valores,
}: {
  label: string;
  unit?: string;
  valores: Array<{ anio: number; texto: string }>;
}) {
  const multi = valores.length > 1;
  return (
    <div className="rounded-lg px-4 py-3 border bg-muted/40 border-border">
      <p className="text-xs text-muted-foreground font-body mb-1.5">{label}</p>
      <div className={multi ? "space-y-0.5" : ""}>
        {valores.map(({ anio, texto }) => (
          <div
            key={anio}
            className="flex items-baseline gap-1.5 leading-tight"
          >
            {multi && (
              <span className="text-[10px] font-body font-medium text-muted-foreground tabular-nums w-9 shrink-0">
                {anio}
              </span>
            )}
            <p
              className={`font-display font-semibold text-foreground ${
                multi ? "text-sm" : "text-lg"
              }`}
            >
              {texto}
              {unit && (
                <span className="text-xs font-body font-normal text-muted-foreground ml-1">
                  {unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const KPIS: Array<{
  key: VariableKey;
  label: string;
  formato: "numero" | "decimal" | "porcentaje";
  unit?: string;
}> = [
  { key: "poblacion_total", label: "Población total", formato: "numero" },
  { key: "densidad_hab_km2", label: "Densidad", formato: "decimal", unit: "hab/km²" },
  { key: "pct_urbana", label: "Población urbana", formato: "porcentaje" },
  { key: "pct_rural", label: "Población rural", formato: "porcentaje" },
  { key: "pct_indigena", label: "Población indígena", formato: "porcentaje" },
  { key: "pct_hombres", label: "Hombres", formato: "porcentaje" },
  { key: "pct_mujeres", label: "Mujeres", formato: "porcentaje" },
  { key: "analfabetismo_pct", label: "Analfabetismo", formato: "porcentaje" },
  { key: "acceso_agua_pct", label: "Acceso a agua", formato: "porcentaje" },
  { key: "acceso_saneamiento_pct", label: "Acceso a saneamiento", formato: "porcentaje" },
  { key: "esperanza_vida", label: "Esperanza de vida", formato: "decimal", unit: "años" },
  { key: "fecundidad", label: "Tasa de fecundidad", formato: "decimal" },
  { key: "crecimiento_anual_pct", label: "Crecimiento anual", formato: "porcentaje" },
  { key: "tiempo_duplicacion_anios", label: "Tiempo de duplicación", formato: "decimal", unit: "años" },
  { key: "idh_ranking", label: "Ranking IDH", formato: "numero" },
];

interface ChartEntrySolo {
  label: string;
  valor: number;
  promedio: number;
  isAlert: boolean;
}

interface ChartEntryComparativo {
  label: string;
  isAlert: boolean;
  [serieAnio: string]: number | string | boolean;
}

export default function FichaPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const anios = useFiltros((s) => s.anios);
  const multiAnio = anios.length > 1;
  const anioMasReciente = anios[anios.length - 1];

  const { data: deptoPorAnio, isLoading, isError } = useDepartamentoMulti(
    slug ?? null,
    anios
  );
  const { data: resumenPorAnio } = useResumenIndicadoresMulti(anios);
  // Department list for selector & nav uses the most recent year for names.
  const { data: todos } = useDepartamentos({ anio: anioMasReciente });

  const deptoMasReciente = deptoPorAnio.find(
    (p) => p.anio === anioMasReciente
  )?.data;

  // Charts
  const chartDataSolo: ChartEntrySolo[] = !multiAnio
    ? VARIABLES.filter((v) => v.formato === "porcentaje").flatMap((v) => {
        const raw = deptoMasReciente?.indicadores?.[v.key];
        if (typeof raw !== "number") return [];
        const resumen = resumenPorAnio[0]?.data;
        const r = resumen?.find((it) => it.campo === v.key);
        if (!r || r.promedio === null) return [];
        return [
          {
            label: v.label.replace(" (%)", "").replace("Población ", "Pob. "),
            valor: Math.round(raw * 100) / 100,
            promedio: Math.round(r.promedio * 100) / 100,
            isAlert: VARIABLES_ALERTA.includes(v.key),
          },
        ];
      })
    : [];

  const chartDataMulti: ChartEntryComparativo[] = multiAnio
    ? VARIABLES.filter((v) => v.formato === "porcentaje").flatMap((v) => {
        const entry: ChartEntryComparativo = {
          label: v.label.replace(" (%)", "").replace("Población ", "Pob. "),
          isAlert: VARIABLES_ALERTA.includes(v.key),
        };
        let anyValue = false;
        for (const { anio, data } of deptoPorAnio) {
          const raw = data?.indicadores?.[v.key];
          if (typeof raw === "number") {
            entry[`a${anio}`] = Math.round(raw * 100) / 100;
            anyValue = true;
          }
          const resumen = resumenPorAnio.find((r) => r.anio === anio)?.data;
          const prom = resumen?.find((it) => it.campo === v.key)?.promedio;
          if (typeof prom === "number") {
            entry[`p${anio}`] = Math.round(prom * 100) / 100;
          }
        }
        return anyValue ? [entry] : [];
      })
    : [];

  // Department picker list (uses the most recent year as authoritative)
  const deptOptions = todos
    ?.slice()
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  if (!slug) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-2xl text-foreground mb-2">
          Ficha departamental
        </h1>
        <p className="text-sm text-muted-foreground font-body mb-6">
          Selecciona un departamento:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {deptOptions?.map((d) => (
            <button
              key={d.slug}
              onClick={() => navigate(`/ficha/${d.slug}`)}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-white hover:border-selva hover:shadow-sm transition-all"
            >
              <DepartamentoShape slug={d.slug} size={96} />
              <span className="text-sm font-body font-medium text-muted-foreground group-hover:text-selva text-center transition-colors">
                {d.nombre}
              </span>
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

  if (isError || !deptoMasReciente) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <p className="text-sm text-muted-foreground font-body">
          Departamento no encontrado.
        </p>
      </div>
    );
  }

  const depto = deptoMasReciente;

  // Build (anio → Indicadores) map for KPI rendering
  const indicadoresPorAnio = new Map<number, Indicadores | null | undefined>();
  for (const { anio, data } of deptoPorAnio) {
    indicadoresPorAnio.set(anio, data?.indicadores);
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
      {/* Back + year selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <SelectorAniosMulti />
      </div>

      {/* Header */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h1 className="font-display font-semibold text-3xl text-foreground leading-tight">
            {depto.nombre}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mt-1 flex-wrap">
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
              Datos {anios.join(" · ")}
            </span>
          </div>
          {depto.descripcion && (
            <p className="text-sm text-muted-foreground font-body mt-3 leading-relaxed max-w-2xl border-l-2 border-border pl-3">
              {depto.descripcion}
            </p>
          )}
        </div>
        <DepartamentoShape
          slug={depto.slug}
          size={160}
          className="shrink-0 self-start"
        />
      </div>

      {/* KPI grid */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Indicadores
        </h2>
        <div
          className={`grid gap-2 ${
            multiAnio
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          }`}
        >
          {KPIS.map(({ key, label, formato, unit }) => {
            const valores = anios.map((anio) => {
              const ind = indicadoresPorAnio.get(anio);
              const raw = ind?.[key];
              return {
                anio,
                texto: formatearValor(
                  typeof raw === "number" ? raw : null,
                  formato
                ),
              };
            });
            return (
              <KpiCard
                key={key}
                label={label}
                unit={unit}
                valores={valores}
              />
            );
          })}
        </div>
      </div>

      {/* Chart */}
      {!multiAnio && chartDataSolo.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-1">
            Comparación con promedio nacional
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Variables en porcentaje · verde = {depto.nombre} · gris = promedio nacional
          </p>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 560 }}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={chartDataSolo}
                  margin={{ top: 8, right: 16, left: 0, bottom: 88 }}
                  barCategoryGap="25%"
                  barGap={2}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={64}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    width={36}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${value.toLocaleString("es-GT", {
                        maximumFractionDigits: 2,
                      })}%`,
                      name === "valor" ? depto.nombre : "Promedio nacional",
                    ]}
                    contentStyle={{ fontSize: 12, fontFamily: "inherit" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) =>
                      value === "valor" ? depto.nombre : "Promedio nacional"
                    }
                    wrapperStyle={{ fontSize: 12, fontFamily: "inherit", paddingTop: 24 }}
                  />
                  <Bar
                    dataKey="valor"
                    fill="#1B6B3A"
                    fillOpacity={0.85}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="promedio"
                    fill="#94a3b8"
                    fillOpacity={0.6}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {multiAnio && chartDataMulti.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-1">
            Evolución por año
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            {depto.nombre} vs. promedio nacional, por cada año seleccionado.
          </p>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 720 }}>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart
                  data={chartDataMulti}
                  margin={{ top: 8, right: 16, left: 0, bottom: 96 }}
                  barCategoryGap="20%"
                  barGap={1}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={64}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    width={36}
                    tickFormatter={(v) => `${v}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const s = typeof name === "string" ? name : "";
                      const anio = s.slice(1);
                      const tipo = s.startsWith("p") ? "Promedio" : depto.nombre;
                      return [
                        `${value.toLocaleString("es-GT", {
                          maximumFractionDigits: 2,
                        })}%`,
                        `${tipo} · ${anio}`,
                      ];
                    }}
                    contentStyle={{ fontSize: 12, fontFamily: "inherit" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => {
                      const s = typeof value === "string" ? value : "";
                      const anio = s.slice(1);
                      return s.startsWith("p")
                        ? `Promedio ${anio}`
                        : `${depto.nombre} ${anio}`;
                    }}
                    wrapperStyle={{ fontSize: 12, fontFamily: "inherit", paddingTop: 28 }}
                  />
                  {anios.flatMap((anio, i) => [
                    <Bar
                      key={`a${anio}`}
                      dataKey={`a${anio}`}
                      name={`a${anio}`}
                      fill={colorPorAnio(anio, i)}
                      fillOpacity={0.9}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={18}
                    />,
                    <Bar
                      key={`p${anio}`}
                      dataKey={`p${anio}`}
                      name={`p${anio}`}
                      fill={colorPromedioPorAnio(anio, i)}
                      fillOpacity={0.85}
                      radius={[3, 3, 0, 0]}
                      maxBarSize={18}
                    />,
                  ])}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Department nav */}
      {deptOptions && (
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground font-body mb-3">
            Otros departamentos
          </p>
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
