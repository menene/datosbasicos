import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  CartesianGrid,
} from "recharts";
import { useDepartamentos, useResumenIndicadores } from "@/api/departamentos";
import { useFiltros } from "@/store/filtros";
import { VARIABLES, VARIABLES_ALERTA } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";
import { formatearValor } from "@/lib/utils";
import { getColorForValue } from "@/lib/colores";

const ANIO = 2025;

// ── Variable selector ────────────────────────────────────────────────────────

function VarSelect({
  value,
  onChange,
  label,
}: {
  value: VariableKey;
  onChange: (v: VariableKey) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-body">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VariableKey)}
        className="text-sm font-body border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-selva"
      >
        {VARIABLES.map((v) => (
          <option key={v.key} value={v.key}>
            {v.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Custom tooltip for ranking chart ────────────────────────────────────────

function RankingTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { nombre: string; valor: number; formatted: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-display font-semibold text-foreground">{d.nombre}</p>
      <p className="text-muted-foreground font-body">{d.formatted}</p>
    </div>
  );
}

// ── Custom tooltip for scatter chart ────────────────────────────────────────

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { nombre: string; x: number; y: number; xFmt: string; yFmt: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-display font-semibold text-foreground">{d.nombre}</p>
      <p className="text-xs text-muted-foreground font-body">
        X: <span className="text-foreground font-medium">{d.xFmt}</span>
      </p>
      <p className="text-xs text-muted-foreground font-body">
        Y: <span className="text-foreground font-medium">{d.yFmt}</span>
      </p>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function GraficasPage() {
  const navigate = useNavigate();
  const { variableActiva, setVariable: setVariableActiva } = useFiltros();
  const [sortAsc, setSortAsc] = useState(false);
  const [varX, setVarX] = useState<VariableKey>("acceso_agua_pct");
  const [varY, setVarY] = useState<VariableKey>("analfabetismo_pct");

  const { data: departamentos, isLoading } = useDepartamentos({ anio: ANIO });
  const { data: resumen } = useResumenIndicadores(ANIO);

  const varInfo = VARIABLES.find((v) => v.key === variableActiva)!;
  const varXInfo = VARIABLES.find((v) => v.key === varX)!;
  const varYInfo = VARIABLES.find((v) => v.key === varY)!;

  const resumenMap = useMemo(() => {
    const m = new Map<string, { minimo: number; maximo: number }>();
    resumen?.forEach((r) => {
      if (r.minimo !== null && r.maximo !== null)
        m.set(r.campo, { minimo: r.minimo, maximo: r.maximo });
    });
    return m;
  }, [resumen]);

  // Ranking data
  const rankingData = useMemo(() => {
    if (!departamentos) return [];
    const rows = departamentos
      .map((d) => {
        const raw = d.indicadores?.[variableActiva] ?? null;
        return { nombre: d.nombre, slug: d.slug, valor: raw };
      })
      .filter((r): r is { nombre: string; slug: string; valor: number } =>
        r.valor !== null
      );

    const r = resumenMap.get(variableActiva);
    return rows
      .sort((a, b) => sortAsc ? a.valor - b.valor : b.valor - a.valor)
      .map((row) => ({
        ...row,
        formatted: formatearValor(row.valor, varInfo.formato),
        color: r
          ? getColorForValue(variableActiva, row.valor, r.minimo, r.maximo)
          : "#1B6B3A",
      }));
  }, [departamentos, variableActiva, sortAsc, resumenMap, varInfo]);

  // Scatter data
  const scatterData = useMemo(() => {
    if (!departamentos) return [];
    return departamentos.flatMap((d) => {
      const x = d.indicadores?.[varX] ?? null;
      const y = d.indicadores?.[varY] ?? null;
      if (x === null || y === null) return [];
      return [{
        nombre: d.nombre,
        slug: d.slug,
        x,
        y,
        xFmt: formatearValor(x, varXInfo.formato),
        yFmt: formatearValor(y, varYInfo.formato),
      }];
    });
  }, [departamentos, varX, varY, varXInfo, varYInfo]);

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-12">
      {/* ── Ranking ── */}
      <section>
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div className="flex-1 min-w-48">
            <VarSelect
              value={variableActiva}
              onChange={setVariableActiva}
              label="Variable"
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setSortAsc(false)}
              className={`px-3 py-1.5 rounded-l-md border text-xs font-body transition-colors ${
                !sortAsc
                  ? "bg-selva text-white border-selva"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Mayor → menor
            </button>
            <button
              onClick={() => setSortAsc(true)}
              className={`px-3 py-1.5 rounded-r-md border-y border-r text-xs font-body transition-colors ${
                sortAsc
                  ? "bg-selva text-white border-selva"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Menor → mayor
            </button>
          </div>
        </div>

        <h2 className="font-display font-semibold text-lg text-foreground mb-4">
          Ranking: {varInfo.label}
        </h2>

        <ResponsiveContainer width="100%" height={Math.max(420, rankingData.length * 28)}>
          <BarChart
            data={rankingData}
            layout="vertical"
            margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
            barSize={18}
          >
            <XAxis
              type="number"
              tick={{ fontSize: 11, fontFamily: "inherit" }}
              tickFormatter={(v) =>
                varInfo.formato === "numero"
                  ? new Intl.NumberFormat("es-GT", { notation: "compact" }).format(v)
                  : varInfo.formato === "porcentaje"
                  ? `${v}%`
                  : String(v)
              }
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={120}
              tick={{ fontSize: 11, fontFamily: "inherit" }}
            />
            <Tooltip content={<RankingTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar
              dataKey="valor"
              radius={[0, 4, 4, 0]}
              label={({ x, y, width, height, value }: { x: number; y: number; width: number; height: number; value: number }) => (
                <text
                  x={x + width + 6}
                  y={y + height / 2 + 4}
                  fontSize={11}
                  fontFamily="inherit"
                  fill="#64748b"
                >
                  {formatearValor(value, varInfo.formato)}
                </text>
              )}
              onClick={(d: { slug: string }) => navigate(`/ficha/${d.slug}`)}
              style={{ cursor: "pointer" }}
            >
              {rankingData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground font-body mt-2">
          Haz clic en una barra para ver la ficha del departamento.
        </p>
      </section>

      {/* ── Scatter ── */}
      <section className="border-t border-border pt-10">
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">
          Correlación entre variables
        </h2>

        <div className="flex flex-wrap gap-4 mb-6">
          <VarSelect value={varX} onChange={setVarX} label="Eje X" />
          <VarSelect value={varY} onChange={setVarY} label="Eje Y" />
        </div>

        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name={varXInfo.label}
              tick={{ fontSize: 11, fontFamily: "inherit" }}
              tickFormatter={(v) =>
                varXInfo.formato === "porcentaje" ? `${v}%` : String(v)
              }
              label={{
                value: varXInfo.label,
                position: "insideBottom",
                offset: -12,
                fontSize: 11,
                fontFamily: "inherit",
                fill: "#64748b",
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={varYInfo.label}
              tick={{ fontSize: 11, fontFamily: "inherit" }}
              width={48}
              tickFormatter={(v) =>
                varYInfo.formato === "porcentaje" ? `${v}%` : String(v)
              }
              label={{
                value: varYInfo.label,
                angle: -90,
                position: "insideLeft",
                offset: 12,
                fontSize: 11,
                fontFamily: "inherit",
                fill: "#64748b",
              }}
            />
            <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter
              data={scatterData}
              fill={VARIABLES_ALERTA.includes(varX) || VARIABLES_ALERTA.includes(varY) ? "#8B2500" : "#1B6B3A"}
              fillOpacity={0.75}
              onClick={(d: { slug: string }) => navigate(`/ficha/${d.slug}`)}
              style={{ cursor: "pointer" }}
            />
          </ScatterChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground font-body mt-2">
          Haz clic en un punto para ver la ficha del departamento.
        </p>
      </section>
    </div>
  );
}
