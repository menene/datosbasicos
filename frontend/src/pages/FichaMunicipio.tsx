import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import { useMunicipios } from "@/api/municipios";
import { useDepartamento } from "@/api/departamentos";
import { formatearValor } from "@/lib/utils";
import { VARIABLES_ALERTA } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";
import type { Municipio } from "@/types/municipio";
import KpiCard from "@/components/ficha/KpiCard";
import MunicipioShape from "@/components/ficha/MunicipioShape";
import Breadcrumb from "@/components/ficha/Breadcrumb";

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
];

// % variables to compare against the parent department in the bar chart
const CHART_VARS: Array<{ key: VariableKey; label: string }> = [
  { key: "pct_urbana", label: "Pob. urbana" },
  { key: "pct_rural", label: "Pob. rural" },
  { key: "pct_indigena", label: "Pob. indígena" },
  { key: "pct_hombres", label: "Hombres" },
  { key: "pct_mujeres", label: "Mujeres" },
  { key: "analfabetismo_pct", label: "Analfabetismo" },
  { key: "acceso_agua_pct", label: "Acceso agua" },
  { key: "acceso_saneamiento_pct", label: "Saneamiento" },
  { key: "crecimiento_anual_pct", label: "Crecimiento" },
];

function muniVal(m: Municipio | undefined, key: VariableKey): number | null {
  const v = (m as unknown as Record<string, unknown> | undefined)?.[key];
  return typeof v === "number" ? v : null;
}

export default function FichaMunicipioPage() {
  const { departamento_slug, municipio_slug } = useParams<{
    departamento_slug: string;
    municipio_slug: string;
  }>();
  const navigate = useNavigate();

  const { data: municipios, isLoading, isError } = useMunicipios();
  const { data: depto } = useDepartamento(departamento_slug ?? null);

  const muni = municipios?.find(
    (m) => m.departamento_slug === departamento_slug && m.slug === municipio_slug
  );

  // Other municipios in the same department (nav chips)
  const hermanos = useMemo(
    () =>
      municipios
        ?.filter((m) => m.departamento_slug === departamento_slug)
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [municipios, departamento_slug]
  );

  // Chart: municipio value vs. parent department value, for % variables both have.
  const chartData = useMemo(() => {
    if (!muni) return [];
    return CHART_VARS.flatMap(({ key, label }) => {
      const valor = muniVal(muni, key);
      if (valor === null) return [];
      const depRaw = depto?.indicadores?.[key];
      const promedio = typeof depRaw === "number" ? depRaw : null;
      return [
        {
          label,
          valor: Math.round(valor * 100) / 100,
          promedio: promedio === null ? 0 : Math.round(promedio * 100) / 100,
          tienePromedio: promedio !== null,
          isAlert: VARIABLES_ALERTA.includes(key),
        },
      ];
    });
  }, [muni, depto]);

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

  if (isError || !muni) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <p className="text-sm text-muted-foreground font-body">Municipio no encontrado.</p>
      </div>
    );
  }

  const deptNombre = depto?.nombre ?? muni.departamento;

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Fichas", to: "/ficha" },
          { label: deptNombre, to: `/ficha/${muni.departamento_slug}` },
          { label: muni.nombre },
        ]}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors -mt-4"
      >
        <ArrowLeft size={14} />
        Volver
      </button>

      {/* Header */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-start sm:justify-between gap-6">
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h1 className="font-display font-semibold text-3xl text-foreground leading-tight">
            {muni.nombre}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground font-body mt-1 flex-wrap">
            <Link
              to={`/ficha/${muni.departamento_slug}`}
              className="flex items-center gap-1 hover:text-selva transition-colors"
            >
              <MapPin size={13} />
              {deptNombre}
            </Link>
            {muni.superficie_km2 != null && (
              <span>{new Intl.NumberFormat("es-GT").format(muni.superficie_km2)} km²</span>
            )}
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Datos 2026</span>
          </div>
        </div>
        <MunicipioShape
          slug={muni.slug}
          departamentoSlug={muni.departamento_slug}
          size={160}
          className="shrink-0 self-start"
        />
      </div>

      {/* KPI grid */}
      <div>
        <h2 className="font-display font-semibold text-base text-foreground mb-3">
          Indicadores
        </h2>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {KPIS.map(({ key, label, formato, unit }) => (
            <KpiCard
              key={key}
              label={label}
              unit={unit}
              valores={[{ anio: 2026, texto: formatearValor(muniVal(muni, key), formato) }]}
            />
          ))}
        </div>
      </div>

      {/* Chart: vs parent department */}
      {chartData.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-base text-foreground mb-1">
            Comparación con el departamento
          </h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Variables en porcentaje · verde = {muni.nombre} · gris = {deptNombre}
          </p>
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 560 }}>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={chartData}
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
                      `${value.toLocaleString("es-GT", { maximumFractionDigits: 2 })}%`,
                      name === "valor" ? muni.nombre : deptNombre,
                    ]}
                    contentStyle={{ fontSize: 12, fontFamily: "inherit" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value) => (value === "valor" ? muni.nombre : deptNombre)}
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

      {/* Municipio nav (same department) */}
      {hermanos && hermanos.length > 1 && (
        <div className="border-t border-border pt-6">
          <p className="text-xs text-muted-foreground font-body mb-3">
            Otros municipios de {deptNombre}
          </p>
          <div className="flex flex-wrap gap-2">
            {hermanos.map((m) => (
              <button
                key={m.slug}
                onClick={() => navigate(`/ficha/${m.departamento_slug}/${m.slug}`)}
                className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
                  m.slug === municipio_slug
                    ? "bg-selva text-white border-selva"
                    : "border-border text-muted-foreground hover:border-selva hover:text-selva"
                }`}
              >
                {m.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
