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
  Legend,
} from "recharts";
import {
  useDepartamentosMulti,
  useResumenIndicadoresMulti,
} from "@/api/departamentos";
import { useFiltros } from "@/store/filtros";
import SelectorAniosMulti from "@/components/SelectorAniosMulti";
import { VARIABLES, VARIABLES_ALERTA } from "@/types/departamento";
import type { VariableKey } from "@/types/departamento";
import { formatearValor } from "@/lib/utils";
import { getColorForValue } from "@/lib/colores";

const COLORES_ANIO: Record<number, string> = {
  1994: "#1E4D8C",
  2005: "#8B4513",
  2025: "#1B6B3A",
};
const FALLBACK = ["#5B21B6", "#0e7490", "#854D0E"];
const colorPorAnio = (anio: number, idx: number): string =>
  COLORES_ANIO[anio] ?? FALLBACK[idx % FALLBACK.length];

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

// ── Tooltips ─────────────────────────────────────────────────────────────────

function RankingTooltipSolo({
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

interface RankingTooltipMultiPayload {
  payload: { nombre: string } & Record<string, number | string>;
}

function RankingTooltipMulti({
  active,
  payload,
  formato,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  formato: VariableKey extends infer K
    ? K extends VariableKey
      ? "numero" | "decimal" | "porcentaje"
      : never
    : never;
}) {
  if (!active || !payload?.length) return null;
  const first = payload[0] as unknown as RankingTooltipMultiPayload;
  const nombre = first.payload.nombre;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-display font-semibold text-foreground mb-1">
        {nombre}
      </p>
      {payload.map((p, i) => {
        const anio = (p.dataKey as string).slice(1);
        return (
          <p key={i} className="text-xs text-muted-foreground font-body">
            {anio}:{" "}
            <span className="text-foreground font-medium">
              {formatearValor(p.value, formato)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: {
    payload: {
      nombre: string;
      anio: number;
      x: number;
      y: number;
      xFmt: string;
      yFmt: string;
    };
  }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-display font-semibold text-foreground">
        {d.nombre}{" "}
        <span className="text-muted-foreground font-body font-normal">
          · {d.anio}
        </span>
      </p>
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
  const anios = useFiltros((s) => s.anios);
  const multiAnio = anios.length > 1;
  const anioReciente = anios[anios.length - 1];

  const [sortAsc, setSortAsc] = useState(false);
  const [varX, setVarX] = useState<VariableKey>("acceso_agua_pct");
  const [varY, setVarY] = useState<VariableKey>("analfabetismo_pct");

  const { data: porAnio, isLoading } = useDepartamentosMulti(anios);
  const { data: resumenPorAnio } = useResumenIndicadoresMulti(anios);

  const varInfo = VARIABLES.find((v) => v.key === variableActiva)!;
  const varXInfo = VARIABLES.find((v) => v.key === varX)!;
  const varYInfo = VARIABLES.find((v) => v.key === varY)!;

  // Ranking ── solo
  const rankingDataSolo = useMemo(() => {
    if (multiAnio) return [];
    const bucket = porAnio[0]?.data ?? [];
    const r =
      resumenPorAnio[0]?.data.find((it) => it.campo === variableActiva) ??
      null;
    const rows = bucket
      .map((d) => ({
        nombre: d.nombre,
        slug: d.slug,
        valor: (d.indicadores?.[variableActiva] as number | null) ?? null,
      }))
      .filter((r): r is { nombre: string; slug: string; valor: number } =>
        r.valor !== null
      );
    return rows
      .sort((a, b) => (sortAsc ? a.valor - b.valor : b.valor - a.valor))
      .map((row) => ({
        ...row,
        formatted: formatearValor(row.valor, varInfo.formato),
        color:
          r && r.minimo !== null && r.maximo !== null
            ? getColorForValue(variableActiva, row.valor, r.minimo, r.maximo)
            : "#1B6B3A",
      }));
  }, [
    multiAnio,
    porAnio,
    resumenPorAnio,
    variableActiva,
    sortAsc,
    varInfo,
  ]);

  // Ranking ── multi (grouped bars per depto)
  const rankingDataMulti = useMemo<Array<Record<string, string | number | null>>>(() => {
    if (!multiAnio) return [];
    const bySlug = new Map<string, Record<string, string | number | null>>();
    for (const { anio, data } of porAnio) {
      for (const d of data) {
        let entry = bySlug.get(d.slug);
        if (!entry) {
          entry = { nombre: d.nombre, slug: d.slug };
          bySlug.set(d.slug, entry);
        }
        const v = d.indicadores?.[variableActiva];
        entry[`a${anio}`] = typeof v === "number" ? v : null;
      }
    }
    const rows = Array.from(bySlug.values()).filter((row) =>
      anios.some((a) => typeof row[`a${a}`] === "number")
    );
    const sortKey = `a${anioReciente}`;
    rows.sort((a, b) => {
      const av = typeof a[sortKey] === "number" ? (a[sortKey] as number) : -Infinity;
      const bv = typeof b[sortKey] === "number" ? (b[sortKey] as number) : -Infinity;
      return sortAsc ? av - bv : bv - av;
    });
    return rows;
  }, [multiAnio, porAnio, anios, variableActiva, sortAsc, anioReciente]);

  // Scatter
  const scatterDataPorAnio = useMemo(() => {
    return porAnio.map(({ anio, data }) => {
      const pts = data.flatMap((d) => {
        const x = (d.indicadores?.[varX] as number | null) ?? null;
        const y = (d.indicadores?.[varY] as number | null) ?? null;
        if (x === null || y === null) return [];
        return [
          {
            nombre: d.nombre,
            slug: d.slug,
            anio,
            x,
            y,
            xFmt: formatearValor(x, varXInfo.formato),
            yFmt: formatearValor(y, varYInfo.formato),
          },
        ];
      });
      return { anio, pts };
    });
  }, [porAnio, varX, varY, varXInfo, varYInfo]);

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
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-xl text-foreground">
            Gráficas
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Rankings y correlaciones · {anios.join(", ")}
          </p>
        </div>
        <SelectorAniosMulti />
      </div>

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
          {multiAnio && (
            <span className="text-xs text-muted-foreground font-body font-normal ml-2">
              · ordenado por {anioReciente}
            </span>
          )}
        </h2>

        {!multiAnio && (
          <ResponsiveContainer
            width="100%"
            height={Math.max(540, rankingDataSolo.length * 38)}
          >
            <BarChart
              data={rankingDataSolo}
              layout="vertical"
              margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
              barSize={28}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fontFamily: "inherit" }}
                tickFormatter={(v) =>
                  varInfo.formato === "numero"
                    ? new Intl.NumberFormat("es-GT", {
                        notation: "compact",
                      }).format(v)
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
              <Tooltip
                content={<RankingTooltipSolo />}
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Bar
                dataKey="valor"
                radius={[0, 4, 4, 0]}
                label={({
                  x,
                  y,
                  width,
                  height,
                  value,
                }: {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                  value: number;
                }) => (
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
                {rankingDataSolo.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {multiAnio && (
          <ResponsiveContainer
            width="100%"
            height={Math.max(620, rankingDataMulti.length * 52)}
          >
            <BarChart
              data={rankingDataMulti}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 0, bottom: 0 }}
              barCategoryGap="18%"
              barGap={2}
              barSize={18}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fontFamily: "inherit" }}
                tickFormatter={(v) =>
                  varInfo.formato === "numero"
                    ? new Intl.NumberFormat("es-GT", {
                        notation: "compact",
                      }).format(v)
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
              <Tooltip
                content={
                  <RankingTooltipMulti
                    formato={
                      varInfo.formato as "numero" | "decimal" | "porcentaje"
                    }
                  />
                }
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{
                  fontSize: 12,
                  fontFamily: "inherit",
                  paddingTop: 12,
                }}
                formatter={(v) =>
                  typeof v === "string" && v.startsWith("a") ? v.slice(1) : v
                }
              />
              {anios.map((anio, i) => (
                <Bar
                  key={anio}
                  dataKey={`a${anio}`}
                  name={`a${anio}`}
                  fill={colorPorAnio(anio, i)}
                  radius={[0, 3, 3, 0]}
                  style={{ cursor: "pointer" }}
                  onClick={(d: { slug: string }) =>
                    navigate(`/ficha/${d.slug}`)
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

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

        <ResponsiveContainer width="100%" height={multiAnio ? 440 : 400}>
          <ScatterChart margin={{ top: 8, right: 24, left: 0, bottom: multiAnio ? 72 : 40 }}>
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
                offset: -8,
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
            <Tooltip
              content={<ScatterTooltip />}
              cursor={{ strokeDasharray: "3 3" }}
            />
            {multiAnio && (
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{
                  fontSize: 12,
                  fontFamily: "inherit",
                  paddingTop: 24,
                }}
              />
            )}
            {scatterDataPorAnio.map(({ anio, pts }, i) => (
              <Scatter
                key={anio}
                name={String(anio)}
                data={pts}
                fill={
                  multiAnio
                    ? colorPorAnio(anio, i)
                    : VARIABLES_ALERTA.includes(varX) ||
                      VARIABLES_ALERTA.includes(varY)
                    ? "#8B2500"
                    : "#1B6B3A"
                }
                fillOpacity={0.75}
                onClick={(d: { slug: string }) => navigate(`/ficha/${d.slug}`)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>

        <p className="text-xs text-muted-foreground font-body mt-2">
          Haz clic en un punto para ver la ficha del departamento.
        </p>
      </section>
    </div>
  );
}
