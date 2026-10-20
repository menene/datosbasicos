import { useMemo, useState } from "react";
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
import { ShieldAlert } from "lucide-react";
import { useMunicipios } from "@/api/municipios";
import { NIVELES_VULNERABILIDAD } from "@/lib/colores";
import { formatearValor } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { VARIABLES_SOLO_MUNICIPIO } from "@/types/departamento";
import type { Variable, VariableKey } from "@/types/departamento";
import type { Municipio } from "@/types/municipio";

// Dos decimales, como el Apéndice 2 del artículo y la ficha del municipio.
const NUM = new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Cuántos municipios muestra el ranking nacional (340 barras no se leen). */
const TOP_N = 20;

/** Color único para las dimensiones: la categoría del artículo es del índice total. */
const COLOR_DIMENSION = "#8B2500";

const colorCategoria = (cat: Municipio["vulnerabilidad_categoria"]) =>
  NIVELES_VULNERABILIDAD.find((n) => n.categoria === cat)?.color ?? COLOR_DIMENSION;

// Indicadores municipales contra los que tiene sentido cruzar la vulnerabilidad.
const EJES_X: Variable[] = [
  { key: "pct_indigena", label: "Población indígena (%)", formato: "porcentaje" },
  { key: "pct_rural", label: "Población rural (%)", formato: "porcentaje" },
  { key: "analfabetismo_pct", label: "Analfabetismo (%)", formato: "porcentaje" },
  { key: "acceso_agua_pct", label: "Acceso a agua (%)", formato: "porcentaje" },
  { key: "acceso_saneamiento_pct", label: "Acceso a saneamiento (%)", formato: "porcentaje" },
  { key: "esperanza_vida", label: "Esperanza de vida (años)", formato: "decimal" },
  { key: "fecundidad", label: "Tasa de fecundidad", formato: "decimal" },
  { key: "densidad_hab_km2", label: "Densidad (hab/km²)", formato: "decimal" },
  { key: "participacion_pct", label: "Participación electoral 2023 (%)", formato: "porcentaje" },
];

function valor(m: Municipio, key: VariableKey): number | null {
  const v = (m as unknown as Record<string, unknown>)[key];
  return typeof v === "number" ? v : null;
}

function Select<T extends string>({
  label,
  value,
  onChange,
  opciones,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  opciones: Array<{ key: T; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground font-body">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="text-sm font-body border border-border rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-selva"
      >
        {opciones.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface Punto {
  nombre: string;
  departamento: string;
  ruta: string;
  categoria: Municipio["vulnerabilidad_categoria"];
  ranking: number | null;
  valor: number;
}

function TooltipMunicipio({
  active,
  payload,
  medida,
  ejeX,
}: {
  active?: boolean;
  payload?: { payload: Punto & { x?: number } }[];
  medida: Variable;
  ejeX?: Variable;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm">
      <p className="font-display font-semibold text-foreground">
        {d.nombre}{" "}
        <span className="text-muted-foreground font-body font-normal">· {d.departamento}</span>
      </p>
      <p className="text-xs text-muted-foreground font-body">
        {medida.label}:{" "}
        <span className="text-foreground font-medium">{NUM.format(d.valor)}</span>
      </p>
      {ejeX && d.x !== undefined && (
        <p className="text-xs text-muted-foreground font-body">
          {ejeX.label}:{" "}
          <span className="text-foreground font-medium">{formatearValor(d.x, ejeX.formato)}</span>
        </p>
      )}
      {d.categoria && (
        <p className="text-xs text-muted-foreground font-body">
          Categoría: <span className="text-foreground font-medium">{d.categoria}</span>
          {d.ranking !== null && ` · puesto ${d.ranking} de 340`}
        </p>
      )}
    </div>
  );
}

/**
 * Vulnerabilidad social multidimensional por municipio (Tercero et al., Clavius
 * 1(1), 2023, con datos del Censo 2018). Es un dato solo municipal y de un único
 * corte, así que va en su propia sección y no sigue al selector de años de la página.
 */
export default function SeccionVulnerabilidad() {
  const navigate = useNavigate();
  const { data: municipios, isLoading } = useMunicipios();

  const [medidaKey, setMedidaKey] = useState<VariableKey>("vulnerabilidad_social");
  const [depto, setDepto] = useState("todos");
  const [masVulnerables, setMasVulnerables] = useState(true);
  const [ejeXKey, setEjeXKey] = useState<VariableKey>("pct_indigena");

  const medida = VARIABLES_SOLO_MUNICIPIO.find((v) => v.key === medidaKey)!;
  const ejeX = EJES_X.find((v) => v.key === ejeXKey)!;
  const esIndiceTotal = medidaKey === "vulnerabilidad_social";

  const departamentos = useMemo(() => {
    const porSlug = new Map<string, string>();
    for (const m of municipios ?? []) porSlug.set(m.departamento_slug, m.departamento);
    return [...porSlug]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [municipios]);

  const seleccion = useMemo(
    () =>
      (municipios ?? []).filter(
        (m) => m.vulnerabilidad_social !== null && (depto === "todos" || m.departamento_slug === depto)
      ),
    [municipios, depto]
  );

  const puntos = useMemo<Punto[]>(
    () =>
      seleccion.flatMap((m) => {
        const v = valor(m, medidaKey);
        if (v === null) return [];
        return [
          {
            nombre: m.nombre,
            departamento: m.departamento,
            ruta: `/ficha/${m.departamento_slug}/${m.slug}`,
            categoria: m.vulnerabilidad_categoria,
            ranking: m.vulnerabilidad_ranking,
            valor: v,
          },
        ];
      }),
    [seleccion, medidaKey]
  );

  // Con todo el país, solo los extremos; con un departamento, todos sus municipios.
  const ranking = useMemo(() => {
    const orden = [...puntos].sort((a, b) =>
      masVulnerables ? b.valor - a.valor : a.valor - b.valor
    );
    const filas = depto === "todos" ? orden.slice(0, TOP_N) : orden;
    return filas.map((p) => ({
      ...p,
      // En el ranking nacional el nombre solo no basta: hay municipios homónimos.
      etiqueta: depto === "todos" ? `${p.nombre} (${p.departamento})` : p.nombre,
      color: esIndiceTotal ? colorCategoria(p.categoria) : COLOR_DIMENSION,
    }));
  }, [puntos, masVulnerables, depto, esIndiceTotal]);

  const porCategoria = useMemo(
    () =>
      NIVELES_VULNERABILIDAD.map((n) => ({
        etiqueta: n.etiqueta,
        color: n.color,
        n: seleccion.filter((m) => m.vulnerabilidad_categoria === n.categoria).length,
      })),
    [seleccion]
  );

  const dispersion = useMemo(
    () =>
      seleccion.flatMap((m) => {
        const x = valor(m, ejeXKey);
        const y = valor(m, medidaKey);
        if (x === null || y === null) return [];
        return [
          {
            nombre: m.nombre,
            departamento: m.departamento,
            ruta: `/ficha/${m.departamento_slug}/${m.slug}`,
            categoria: m.vulnerabilidad_categoria,
            ranking: m.vulnerabilidad_ranking,
            valor: y,
            x,
            color: colorCategoria(m.vulnerabilidad_categoria),
          },
        ];
      }),
    [seleccion, ejeXKey, medidaKey]
  );

  const irAFicha = (ruta: string, origen: string) => {
    track("navegar_a_ficha", { destino: ruta, origen });
    navigate(ruta);
  };

  const nombreDepto = departamentos.find((d) => d.key === depto)?.label;
  const ambito = nombreDepto ? `en ${nombreDepto}` : "en el país";

  return (
    <section className="border-t border-border pt-10 space-y-10">
      <div>
        <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
          <ShieldAlert size={18} className="text-[#8B2500]" />
          Vulnerabilidad social por municipio
        </h2>
        <p className="text-xs text-muted-foreground font-body mt-1 max-w-3xl leading-relaxed">
          Índice de vulnerabilidad social multidimensional: suma de seis ámbitos, mayor valor =
          más vulnerable. Tercero et al., <i>Clavius</i> 1(1), 2023, con datos del Censo 2018. Es
          un solo corte, así que no cambia con los años seleccionados arriba.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <Select
            label="Medida"
            value={medidaKey}
            onChange={(v) => {
              setMedidaKey(v);
              track("variable_seleccionada", { variable: v, origen: "graficas_vulnerabilidad" });
            }}
            opciones={VARIABLES_SOLO_MUNICIPIO.map((v) => ({ key: v.key, label: v.label }))}
          />
        </div>
        <div className="min-w-48">
          <Select
            label="Departamento"
            value={depto}
            onChange={setDepto}
            opciones={[{ key: "todos", label: "Todo el país" }, ...departamentos]}
          />
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {
              if (masVulnerables) return;
              setMasVulnerables(true);
              track("grafica_orden", { direccion: "desc", variable: medidaKey });
            }}
            className={`px-3 py-1.5 rounded-l-md border text-xs font-body transition-colors ${
              masVulnerables
                ? "bg-selva text-white border-selva"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Más vulnerables
          </button>
          <button
            onClick={() => {
              if (!masVulnerables) return;
              setMasVulnerables(false);
              track("grafica_orden", { direccion: "asc", variable: medidaKey });
            }}
            className={`px-3 py-1.5 rounded-r-md border-y border-r text-xs font-body transition-colors ${
              !masVulnerables
                ? "bg-selva text-white border-selva"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Menos vulnerables
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 bg-muted rounded-xl animate-pulse" />
      ) : (
        <>
          {/* ── Ranking de municipios ── */}
          <div>
            <h3 className="font-display font-semibold text-base text-foreground mb-1">
              {depto === "todos"
                ? `Los ${TOP_N} municipios ${masVulnerables ? "más" : "menos"} vulnerables`
                : `Municipios de ${nombreDepto}`}
              <span className="text-xs text-muted-foreground font-body font-normal ml-2">
                · {medida.label}
              </span>
            </h3>
            {esIndiceTotal && <LeyendaCategorias />}
            <ResponsiveContainer width="100%" height={Math.max(320, ranking.length * 30)}>
              <BarChart
                data={ranking}
                layout="vertical"
                margin={{ top: 8, right: 56, left: 0, bottom: 0 }}
                barSize={20}
              >
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "inherit" }} />
                <YAxis
                  type="category"
                  dataKey="etiqueta"
                  width={depto === "todos" ? 230 : 170}
                  tick={{ fontSize: 11, fontFamily: "inherit" }}
                  interval={0}
                />
                <Tooltip
                  content={<TooltipMunicipio medida={medida} />}
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                />
                <Bar
                  dataKey="valor"
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: "right",
                    fontSize: 11,
                    fontFamily: "inherit",
                    fill: "#64748b",
                    formatter: (v: number) => NUM.format(v),
                  }}
                  onClick={(d: { ruta: string }) => irAFicha(d.ruta, "ranking_vulnerabilidad")}
                  style={{ cursor: "pointer" }}
                >
                  {ranking.map((p) => (
                    <Cell key={p.ruta} fill={p.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground font-body mt-2">
              Haz clic en una barra para ver la ficha del municipio.
            </p>
          </div>

          {/* ── Municipios por categoría ── */}
          <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div>
              <h3 className="font-display font-semibold text-base text-foreground mb-1">
                Municipios por categoría {ambito}
              </h3>
              <p className="text-xs text-muted-foreground font-body mb-4">
                {seleccion.length} municipios · categoría del índice total
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porCategoria} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fontFamily: "inherit" }} />
                  <YAxis
                    allowDecimals={false}
                    width={36}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} municipios`, "Total"]}
                    contentStyle={{ fontSize: 12, fontFamily: "inherit" }}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Bar
                    dataKey="n"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={56}
                    label={{ position: "top", fontSize: 11, fontFamily: "inherit", fill: "#64748b" }}
                  >
                    {porCategoria.map((c) => (
                      <Cell key={c.etiqueta} fill={c.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Dispersión contra otro indicador municipal ── */}
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <h3 className="font-display font-semibold text-base text-foreground">
                  {medida.label} frente a…
                </h3>
                <Select
                  label="Eje X"
                  value={ejeXKey}
                  onChange={(v) => {
                    setEjeXKey(v);
                    track("dispersion_ejes", { eje: "x", variable: v });
                  }}
                  opciones={EJES_X.map((v) => ({ key: v.key, label: v.label }))}
                />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={ejeX.label}
                    domain={ejeX.formato === "porcentaje" ? [0, 100] : ["auto", "auto"]}
                    allowDecimals={false}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    tickFormatter={(v) => (ejeX.formato === "porcentaje" ? `${v}%` : String(v))}
                    label={{
                      value: ejeX.label,
                      position: "insideBottom",
                      offset: -20,
                      fontSize: 11,
                      fontFamily: "inherit",
                      fill: "#64748b",
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="valor"
                    name={medida.label}
                    domain={[0, "auto"]}
                    allowDecimals={false}
                    width={40}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                  />
                  <Tooltip
                    content={<TooltipMunicipio medida={medida} ejeX={ejeX} />}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    data={dispersion}
                    fillOpacity={0.75}
                    onClick={(d: { ruta: string }) =>
                      irAFicha(d.ruta, "dispersion_vulnerabilidad")
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {dispersion.map((p) => (
                      <Cell key={p.ruta} fill={p.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground font-body mt-2">
                Cada punto es un municipio, coloreado por la categoría de su índice total.
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function LeyendaCategorias() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
      {NIVELES_VULNERABILIDAD.map((n) => (
        <span
          key={n.categoria}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body"
        >
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: n.color }} />
          {n.etiqueta}
        </span>
      ))}
    </div>
  );
}
