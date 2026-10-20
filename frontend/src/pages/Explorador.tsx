import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as d3 from "d3";
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
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Check, Download, Link2, RotateCcw, Table2 } from "lucide-react";
import { useDepartamentosMulti } from "@/api/departamentos";
import { useMunicipios } from "@/api/municipios";
import { NIVELES_VULNERABILIDAD } from "@/lib/colores";
import { formatearValor } from "@/lib/utils";
import { track, trackDebounced } from "@/lib/analytics";
import {
  ANIOS_NIVEL,
  LIMITE_MUNICIPIOS,
  REGIONES,
  escribirEstado,
  filasDepartamentos,
  filasMunicipios,
  infoVariable,
  leerEstado,
  mediana,
  pasaFiltrosLugar,
  pasaRango,
  pearson,
  variablesConDatos,
} from "@/lib/explorador";
import type { Estado, Fila, ModoColor, Nivel, Tipo } from "@/lib/explorador";
import type { Variable, VariableKey } from "@/types/departamento";
import type { CategoriaVulnerabilidad } from "@/types/municipio";

const ACENTO = "#1B6B3A";
const APAGADO = "#CFC8BC";
const PROMEDIO = "#3A2A18";

const TIPOS: Array<{ key: Tipo; label: string; ayuda: string }> = [
  { key: "ranking", label: "Ranking", ayuda: "Ordena los lugares por una variable" },
  { key: "dispersion", label: "Dispersión", ayuda: "Cruza dos variables" },
  { key: "evolucion", label: "Evolución", ayuda: "Cómo cambió con los años" },
];

const colorCategoria = (c: CategoriaVulnerabilidad | null) =>
  NIVELES_VULNERABILIDAD.find((n) => n.categoria === c)?.color ?? APAGADO;

/** Dominio y marcas redondas (d3 .nice()) para que los ejes no digan 11.55. */
function ejeBonito(vals: number[], desdeCero = false) {
  if (!vals.length) return { domain: [0, 1] as [number, number], ticks: [0, 1] };
  const [lo, hi] = d3.extent(vals) as [number, number];
  const escala = d3
    .scaleLinear()
    .domain([desdeCero ? Math.min(0, lo) : lo, hi === lo ? hi + 1 : hi])
    .nice(6);
  return { domain: escala.domain() as [number, number], ticks: escala.ticks(6) };
}

function formatoEje(v: Variable) {
  return (n: number) =>
    v.formato === "numero"
      ? new Intl.NumberFormat("es-GT", { notation: "compact" }).format(n)
      : v.formato === "porcentaje"
      ? `${n}%`
      : String(n);
}

/** Ancho de la ventana, para que las etiquetas del ranking no se coman las barras en el teléfono. */
function useAnchoVentana() {
  const [ancho, setAncho] = useState(() => window.innerWidth);
  useEffect(() => {
    const alCambiar = () => setAncho(window.innerWidth);
    window.addEventListener("resize", alCambiar);
    return () => window.removeEventListener("resize", alCambiar);
  }, []);
  return ancho;
}

// ── Controles ───────────────────────────────────────────────────────────────

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground font-body">{label}</span>
      {children}
    </div>
  );
}

const claseSelect =
  "w-full text-sm font-body border border-border rounded-md px-2 py-1.5 bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-selva";

function Segmentado<T extends string>({
  value,
  onChange,
  opciones,
}: {
  value: T;
  onChange: (v: T) => void;
  opciones: Array<{ key: T; label: string; title?: string }>;
}) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden bg-white">
      {opciones.map((o, i) => (
        <button
          key={o.key}
          type="button"
          title={o.title}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`flex-1 px-2 py-1.5 text-xs font-body transition-colors ${
            i > 0 ? "border-l border-border" : ""
          } ${
            value === o.key
              ? "bg-selva text-white font-medium"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SelectVariable({
  value,
  onChange,
  variables,
  disponibles,
  anio,
}: {
  value: VariableKey;
  onChange: (v: VariableKey) => void;
  variables: Variable[];
  /** Claves con dato en el año elegido; las demás se muestran deshabilitadas. */
  disponibles: Set<string> | null;
  anio: number;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as VariableKey)} className={claseSelect}>
      {variables.map((v) => {
        const sinDato = disponibles !== null && !disponibles.has(v.key);
        return (
          <option key={v.key} value={v.key} disabled={sinDato}>
            {v.label}
            {sinDato ? ` (sin datos ${anio})` : ""}
          </option>
        );
      })}
    </select>
  );
}

// ── Tooltips ────────────────────────────────────────────────────────────────

interface Punto {
  fila: Fila;
  etiqueta: string;
  valor: number;
  x?: number;
  color: string;
}

function TooltipPunto({
  active,
  payload,
  v,
  x,
}: {
  active?: boolean;
  payload?: { payload: Punto }[];
  v: Variable;
  x?: Variable;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm max-w-xs">
      <p className="font-display font-semibold text-foreground">{d.fila.nombre}</p>
      <p className="text-xs text-muted-foreground font-body mb-1">
        {d.fila.deptoSlug !== d.fila.id ? `${d.fila.deptoNombre} · ` : ""}
        {d.fila.region ? REGIONES[d.fila.region] ?? d.fila.region : ""} · {d.fila.anio}
      </p>
      {x && d.x !== undefined && (
        <p className="text-xs text-muted-foreground font-body">
          {x.label}: <span className="text-foreground font-medium">{formatearValor(d.x, x.formato)}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground font-body">
        {v.label}: <span className="text-foreground font-medium">{formatearValor(d.valor, v.formato)}</span>
      </p>
    </div>
  );
}

function TooltipEvolucion({
  active,
  payload,
  label,
  v,
  nombres,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: number;
  v: Variable;
  nombres: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const prom = payload.find((p) => p.dataKey === "__promedio");
  const filas = payload
    .filter((p) => p.dataKey !== "__promedio" && typeof p.value === "number")
    .sort((a, b) => b.value - a.value);
  const visibles = filas.slice(0, 8);
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-3 py-2 text-sm min-w-52">
      <p className="font-display font-semibold text-foreground mb-1">{label}</p>
      {prom && typeof prom.value === "number" && (
        <p className="text-xs font-body text-foreground flex justify-between gap-4 border-b border-border pb-1 mb-1">
          <span>Promedio de la selección</span>
          <span className="font-medium tabular-nums">{formatearValor(prom.value, v.formato)}</span>
        </p>
      )}
      {visibles.map((p) => (
        <p key={p.dataKey} className="text-xs font-body text-muted-foreground flex justify-between gap-4">
          <span className="inline-flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            {nombres.get(p.dataKey)}
          </span>
          <span className="text-foreground font-medium tabular-nums">{formatearValor(p.value, v.formato)}</span>
        </p>
      ))}
      {filas.length > visibles.length && (
        <p className="text-[11px] text-muted-foreground font-body mt-1">
          y {filas.length - visibles.length} más
        </p>
      )}
    </div>
  );
}

// ── Página ──────────────────────────────────────────────────────────────────

export default function ExploradorPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const e = leerEstado(params);
  const [verTabla, setVerTabla] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const anchoVentana = useAnchoVentana();

  const { data: porAnio, isLoading: cargandoD } = useDepartamentosMulti(ANIOS_NIVEL.departamentos);
  const { data: municipios, isLoading: cargandoM } = useMunicipios();

  function cambiar(cambios: Partial<Estado>, control?: string, valor?: string) {
    setParams(escribirEstado({ ...e, ...cambios }), { replace: true });
    if (control) track("explorador_cambio", { control, valor: valor ?? "" });
  }

  // ── Datos ──
  const regionDe = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const { data } of porAnio) for (const d of data) m.set(d.slug, d.region);
    return m;
  }, [porAnio]);

  const filas = useMemo(
    () =>
      e.nivel === "departamentos"
        ? filasDepartamentos(porAnio)
        : filasMunicipios(municipios ?? [], regionDe),
    [e.nivel, porAnio, municipios, regionDe]
  );
  const variables = useMemo(() => variablesConDatos(filas), [filas]);
  const lugares = useMemo(() => filas.filter((f) => pasaFiltrosLugar(f, e)), [filas, e]);

  const disponiblesAnio = useMemo(() => {
    const s = new Set<string>();
    for (const f of filas) if (f.anio === e.anio) for (const k of Object.keys(f.valores)) s.add(k);
    return s;
  }, [filas, e.anio]);

  const departamentos = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of filas) m.set(f.deptoSlug, f.deptoNombre);
    return [...m].sort((a, b) => a[1].localeCompare(b[1], "es"));
  }, [filas]);

  const v = infoVariable(e.v);
  const vx = infoVariable(e.x);
  const conDepto = e.nivel === "municipios" && !e.depto;
  const etiqueta = (f: Fila) => (conDepto ? `${f.nombre} (${f.deptoNombre})` : f.nombre);

  const colorDe = (f: Fila): string => {
    switch (e.color) {
      case "region":
        return !e.resaltar || f.region === e.resaltar ? ACENTO : APAGADO;
      case "depto":
        return !e.resaltar || f.deptoSlug === e.resaltar ? ACENTO : APAGADO;
      case "categoria":
        return colorCategoria(f.categoria);
      default:
        return ACENTO;
    }
  };
  const resaltado = (f: Fila) => colorDe(f) !== APAGADO;

  const ordenar = (a: number, b: number) => (e.orden === "desc" ? b - a : a - b);

  // Ranking
  const ranking = useMemo<Punto[]>(() => {
    if (e.tipo !== "ranking") return [];
    const filasAnio = lugares
      .filter((f) => f.anio === e.anio && pasaRango(f.valores[e.v], e))
      .map((f) => ({ fila: f, etiqueta: etiqueta(f), valor: f.valores[e.v]!, color: colorDe(f) }))
      .sort((a, b) => ordenar(a.valor, b.valor));
    return e.limite === null ? filasAnio : filasAnio.slice(0, e.limite);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugares, e.tipo, e.anio, e.v, e.min, e.max, e.orden, e.limite, e.color, e.resaltar, conDepto]);

  // Dispersión: los resaltados se dibujan al final, encima de los apagados.
  const dispersion = useMemo<Punto[]>(() => {
    if (e.tipo !== "dispersion") return [];
    return lugares
      .filter(
        (f) => f.anio === e.anio && f.valores[e.x] !== undefined && pasaRango(f.valores[e.v], e)
      )
      .map((f) => ({
        fila: f,
        etiqueta: etiqueta(f),
        valor: f.valores[e.v]!,
        x: f.valores[e.x]!,
        color: colorDe(f),
      }))
      .sort((a, b) => Number(a.color !== APAGADO) - Number(b.color !== APAGADO));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugares, e.tipo, e.anio, e.v, e.x, e.min, e.max, e.color, e.resaltar, conDepto]);

  // Evolución: una línea por lugar; el rango y el orden se aplican al último dato.
  const evolucion = useMemo(() => {
    if (e.tipo !== "evolucion") return null;
    const porLugar = new Map<string, Fila[]>();
    for (const f of lugares) {
      if (f.valores[e.v] === undefined) continue;
      porLugar.set(f.id, [...(porLugar.get(f.id) ?? []), f]);
    }
    const series = [...porLugar.values()]
      .map((fs) => {
        const ordenadas = fs.sort((a, b) => a.anio - b.anio);
        const ultima = ordenadas[ordenadas.length - 1];
        return { id: ultima.id, ultima, fs: ordenadas, ultimo: ultima.valores[e.v]! };
      })
      .filter((s) => pasaRango(s.ultimo, e))
      .sort((a, b) => ordenar(a.ultimo, b.ultimo));
    const visibles = e.limite === null ? series : series.slice(0, e.limite);
    const anios = [...new Set(visibles.flatMap((s) => s.fs.map((f) => f.anio)))].sort((a, b) => a - b);
    const datos = anios.map((anio) => {
      const fila: Record<string, number> = { anio };
      const vals: number[] = [];
      for (const s of visibles) {
        const val = s.fs.find((f) => f.anio === anio)?.valores[e.v];
        if (val !== undefined) {
          fila[s.id] = val;
          vals.push(val);
        }
      }
      if (vals.length) fila.__promedio = d3.mean(vals)!;
      return fila;
    });
    // Los resaltados al final para que queden encima.
    const lineas = visibles
      .map((s) => ({ id: s.id, nombre: etiqueta(s.ultima), color: colorDe(s.ultima), fila: s.ultima }))
      .sort((a, b) => Number(a.color !== APAGADO) - Number(b.color !== APAGADO));
    return { datos, anios, lineas, total: series.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lugares, e.tipo, e.v, e.min, e.max, e.orden, e.limite, e.color, e.resaltar, conDepto]);

  // Valores de la vista actual, para el resumen y la tabla.
  const valoresVista: Array<{ nombre: string; valor: number }> =
    e.tipo === "ranking"
      ? ranking.map((p) => ({ nombre: p.etiqueta, valor: p.valor }))
      : e.tipo === "dispersion"
      ? dispersion.map((p) => ({ nombre: p.etiqueta, valor: p.valor }))
      : (evolucion?.lineas ?? []).map((l) => ({
          nombre: l.nombre,
          valor: (evolucion!.datos[evolucion!.datos.length - 1]?.[l.id] as number) ?? NaN,
        })).filter((x) => Number.isFinite(x.valor));

  const resumen = useMemo(() => {
    const vals = valoresVista.map((x) => x.valor);
    if (!vals.length) return null;
    const max = valoresVista.reduce((a, b) => (b.valor > a.valor ? b : a));
    const min = valoresVista.reduce((a, b) => (b.valor < a.valor ? b : a));
    // Un promedio de personas con decimales («90,108.235») no se lee: se redondea.
    const redondear = (n: number) => (v.formato === "numero" ? Math.round(n) : n);
    return {
      n: vals.length,
      promedio: redondear(d3.mean(vals)!),
      mediana: redondear(mediana(vals)!),
      max,
      min,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valoresVista, v.formato]);

  const r = e.tipo === "dispersion" ? pearson(dispersion.map((p) => ({ x: p.x!, y: p.valor }))) : null;

  // Años con dato de la variable principal (para el aviso de vista vacía).
  const aniosConDato = ANIOS_NIVEL[e.nivel].filter((a) =>
    filas.some((f) => f.anio === a && f.valores[e.v] !== undefined)
  );

  const vacia =
    e.tipo === "ranking"
      ? ranking.length === 0
      : e.tipo === "dispersion"
      ? dispersion.length === 0
      : !evolucion || evolucion.lineas.length === 0;

  const unidad = e.nivel === "departamentos" ? "departamentos" : "municipios";
  const totalLugares = new Set(lugares.map((f) => f.id)).size;

  // ── Tabla y CSV (la misma vista en filas) ──
  const tabla = useMemo(() => {
    const lugarCol = e.nivel === "municipios" ? "Departamento" : "Región";
    const lugarDe = (f: Fila) =>
      e.nivel === "municipios" ? f.deptoNombre : f.region ? REGIONES[f.region] ?? f.region : "";
    if (e.tipo === "evolucion" && evolucion) {
      return {
        columnas: ["Lugar", lugarCol, ...evolucion.anios.map(String)],
        filas: [...evolucion.lineas].reverse().map((l) => [
          l.fila.nombre,
          lugarDe(l.fila),
          ...evolucion.datos.map((d) =>
            typeof d[l.id] === "number" ? formatearValor(d[l.id], v.formato) : "—"
          ),
        ]),
        crudo: [...evolucion.lineas].reverse().map((l) => [
          l.fila.nombre,
          lugarDe(l.fila),
          ...evolucion.datos.map((d) => (typeof d[l.id] === "number" ? String(d[l.id]) : "")),
        ]),
      };
    }
    const puntos = e.tipo === "ranking" ? ranking : dispersion;
    const conX = e.tipo === "dispersion";
    return {
      columnas: ["Lugar", lugarCol, ...(conX ? [vx.label] : []), v.label],
      filas: puntos.map((p) => [
        p.fila.nombre,
        lugarDe(p.fila),
        ...(conX ? [formatearValor(p.x!, vx.formato)] : []),
        formatearValor(p.valor, v.formato),
      ]),
      crudo: puntos.map((p) => [
        p.fila.nombre,
        lugarDe(p.fila),
        ...(conX ? [String(p.x)] : []),
        String(p.valor),
      ]),
    };
  }, [e.tipo, e.nivel, evolucion, ranking, dispersion, v, vx]);

  function descargarCsv() {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const csv = [tabla.columnas, ...tabla.crudo].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `explorador-${e.nivel}-${e.tipo}-${e.v}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    track("explorador_csv", { nivel: e.nivel, tipo: e.tipo, variable: e.v, filas: tabla.crudo.length });
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
      track("explorador_enlace", { nivel: e.nivel, tipo: e.tipo });
    } catch {
      // Sin permiso de portapapeles: el enlace sigue en la barra de direcciones.
    }
  }

  const irAFicha = (ruta: string) => {
    track("navegar_a_ficha", { destino: ruta, origen: `explorador_${e.tipo}` });
    navigate(ruta);
  };

  // ── Opciones de color ──
  const opcionesColor: Array<{ key: ModoColor; label: string }> = [
    { key: "uno", label: "Un solo color" },
    { key: "region", label: "Resaltar una región" },
    ...(e.nivel === "municipios"
      ? [
          { key: "depto" as const, label: "Resaltar un departamento" },
          { key: "categoria" as const, label: "Categoría de vulnerabilidad" },
        ]
      : []),
  ];

  function cambiarColor(color: ModoColor) {
    const resaltar =
      color === "region"
        ? e.region ?? Object.keys(REGIONES)[0]
        : color === "depto"
        ? e.depto ?? departamentos[0]?.[0] ?? null
        : null;
    cambiar({ color, resaltar }, "color", color);
  }

  // Municipios con algún año anterior al corte 2025 (los únicos con evolución).
  const conSerie = (municipios ?? []).filter((m) => Object.keys(m.series ?? {}).length > 0).length;

  const cargando = cargandoD || (e.nivel === "municipios" && cargandoM);
  const hayFiltros =
    e.region !== null || e.depto !== null || e.categorias.length > 0 || e.min !== null || e.max !== null;

  // ── Leyenda ──
  const leyenda: Array<{ color: string; label: string }> =
    e.color === "categoria"
      ? NIVELES_VULNERABILIDAD.map((n) => ({ color: n.color, label: n.etiqueta }))
      : e.color === "region" && e.resaltar
      ? [
          { color: ACENTO, label: `Región ${REGIONES[e.resaltar] ?? e.resaltar}` },
          { color: APAGADO, label: "Resto" },
        ]
      : e.color === "depto" && e.resaltar
      ? [
          { color: ACENTO, label: departamentos.find(([s]) => s === e.resaltar)?.[1] ?? e.resaltar },
          { color: APAGADO, label: "Resto" },
        ]
      : [];

  const titulo =
    e.tipo === "ranking"
      ? `${v.label} por ${e.nivel === "departamentos" ? "departamento" : "municipio"}, ${e.anio}`
      : e.tipo === "dispersion"
      ? `${v.label} frente a ${vx.label}, ${e.anio}`
      : `Evolución de ${v.label}`;

  // Las etiquetas no pasan de un tercio del ancho; las largas se recortan (el
  // nombre completo está en el tooltip y en la tabla).
  const maxEtiqueta = Math.min(260, Math.max(90, (anchoVentana - 80) / 3));
  const maxCaracteres = Math.floor(maxEtiqueta / 6.4);
  const anchoEtiquetas = Math.min(
    maxEtiqueta,
    Math.max(60, ...ranking.map((p) => p.etiqueta.length * 6.4))
  );
  const recortar = (t: string) => {
    // Primero sobra el departamento entre paréntesis; después, el final del nombre.
    const corto = t.length > maxCaracteres ? t.replace(/ \([^)]*\)$/, "") : t;
    return corto.length > maxCaracteres ? `${corto.slice(0, maxCaracteres - 1).trimEnd()}…` : corto;
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="font-display font-semibold text-xl text-foreground">Explorador</h1>
        <p className="text-xs text-muted-foreground font-body mt-0.5">
          Arma tu propia gráfica: elige el nivel, el tipo, las variables y los filtros. La
          gráfica queda en el enlace para compartirla.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
        {/* ── Panel de controles ── */}
        <aside className="rounded-xl border border-border bg-muted/30 p-4 space-y-5 lg:sticky lg:top-20">
          <Campo label="Nivel">
            <Segmentado<Nivel>
              value={e.nivel}
              onChange={(nivel) =>
                cambiar(
                  {
                    nivel,
                    depto: null,
                    categorias: [],
                    color: "uno",
                    resaltar: null,
                    limite: nivel === "municipios" ? LIMITE_MUNICIPIOS : null,
                    anio: 2025,
                  },
                  "nivel",
                  nivel
                )
              }
              opciones={[
                { key: "departamentos", label: "Departamentos" },
                { key: "municipios", label: "Municipios" },
              ]}
            />
          </Campo>

          <Campo label="Tipo de gráfica">
            <Segmentado<Tipo>
              value={e.tipo}
              onChange={(tipo) => cambiar({ tipo }, "tipo", tipo)}
              opciones={TIPOS.map((t) => ({ key: t.key, label: t.label, title: t.ayuda }))}
            />
          </Campo>

          {e.tipo === "dispersion" && (
            <Campo label="Eje X">
              <SelectVariable
                value={e.x}
                onChange={(x) => cambiar({ x }, "eje_x", x)}
                variables={variables}
                disponibles={disponiblesAnio}
                anio={e.anio}
              />
            </Campo>
          )}

          <Campo label={e.tipo === "dispersion" ? "Eje Y" : "Variable"}>
            <SelectVariable
              value={e.v}
              onChange={(nueva) => cambiar({ v: nueva, min: null, max: null }, "variable", nueva)}
              variables={variables}
              disponibles={e.tipo === "evolucion" ? null : disponiblesAnio}
              anio={e.anio}
            />
          </Campo>

          {e.tipo !== "evolucion" && (
            <Campo label="Año">
              <Segmentado<string>
                value={String(e.anio)}
                onChange={(a) => cambiar({ anio: Number(a) }, "anio", a)}
                opciones={ANIOS_NIVEL[e.nivel].map((a) => ({ key: String(a), label: String(a) }))}
              />
            </Campo>
          )}

          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-body font-medium text-foreground">Filtros</p>

            <Campo label="Región">
              <select
                value={e.region ?? ""}
                onChange={(ev) =>
                  cambiar({ region: ev.target.value || null, depto: null }, "region", ev.target.value)
                }
                className={claseSelect}
              >
                <option value="">Todas las regiones</option>
                {Object.entries(REGIONES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </Campo>

            {e.nivel === "municipios" && (
              <>
                <Campo label="Departamento">
                  <select
                    value={e.depto ?? ""}
                    onChange={(ev) =>
                      cambiar({ depto: ev.target.value || null }, "depto", ev.target.value)
                    }
                    className={claseSelect}
                  >
                    <option value="">Todos los departamentos</option>
                    {departamentos
                      .filter(([slug]) => !e.region || regionDe.get(slug) === e.region)
                      .map(([slug, nombre]) => (
                        <option key={slug} value={slug}>
                          {nombre}
                        </option>
                      ))}
                  </select>
                </Campo>

                <Campo label="Categoría de vulnerabilidad">
                  <div className="flex flex-wrap gap-1.5">
                    {NIVELES_VULNERABILIDAD.map((n) => {
                      const activa = e.categorias.includes(n.categoria);
                      return (
                        <button
                          key={n.categoria}
                          type="button"
                          aria-pressed={activa}
                          onClick={() => {
                            const categorias = activa
                              ? e.categorias.filter((c) => c !== n.categoria)
                              : [...e.categorias, n.categoria];
                            cambiar({ categorias }, "categoria", categorias.join(","));
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-body transition-colors ${
                            activa
                              ? "border-foreground/40 bg-white text-foreground font-medium"
                              : "border-border bg-white/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                          {n.etiqueta}
                        </button>
                      );
                    })}
                  </div>
                </Campo>
              </>
            )}

            <Campo label={`Rango de ${v.label}`}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Valor mínimo"
                  placeholder="mín."
                  defaultValue={e.min ?? ""}
                  key={`min-${e.v}-${e.min}`}
                  onBlur={(ev) => {
                    const n = ev.target.value === "" ? null : Number(ev.target.value);
                    if (n !== e.min) cambiar({ min: n });
                    trackDebounced("explorador_cambio", { control: "rango", valor: ev.target.value });
                  }}
                  onKeyDown={(ev) => ev.key === "Enter" && (ev.target as HTMLInputElement).blur()}
                  className={claseSelect}
                />
                <span className="text-muted-foreground text-xs">a</span>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Valor máximo"
                  placeholder="máx."
                  defaultValue={e.max ?? ""}
                  key={`max-${e.v}-${e.max}`}
                  onBlur={(ev) => {
                    const n = ev.target.value === "" ? null : Number(ev.target.value);
                    if (n !== e.max) cambiar({ max: n });
                    trackDebounced("explorador_cambio", { control: "rango", valor: ev.target.value });
                  }}
                  onKeyDown={(ev) => ev.key === "Enter" && (ev.target as HTMLInputElement).blur()}
                  className={claseSelect}
                />
              </div>
            </Campo>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-body font-medium text-foreground">Presentación</p>

            {e.tipo !== "dispersion" && (
              <>
                <Campo label="Orden">
                  <Segmentado<"desc" | "asc">
                    value={e.orden}
                    onChange={(orden) => cambiar({ orden }, "orden", orden)}
                    opciones={[
                      { key: "desc", label: "Mayor → menor" },
                      { key: "asc", label: "Menor → mayor" },
                    ]}
                  />
                </Campo>
                <Campo label="Mostrar">
                  <select
                    value={e.limite === null ? "todos" : String(e.limite)}
                    onChange={(ev) =>
                      cambiar(
                        { limite: ev.target.value === "todos" ? null : Number(ev.target.value) },
                        "limite",
                        ev.target.value
                      )
                    }
                    className={claseSelect}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        Los primeros {n}
                      </option>
                    ))}
                    <option value="todos">Todos</option>
                  </select>
                </Campo>
              </>
            )}

            <Campo label="Color">
              <select
                value={e.color}
                onChange={(ev) => cambiarColor(ev.target.value as ModoColor)}
                className={claseSelect}
              >
                {opcionesColor.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
              {e.color === "region" && (
                <select
                  value={e.resaltar ?? ""}
                  onChange={(ev) => cambiar({ resaltar: ev.target.value }, "resaltar", ev.target.value)}
                  className={claseSelect}
                  aria-label="Región resaltada"
                >
                  {Object.entries(REGIONES).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              {e.color === "depto" && (
                <select
                  value={e.resaltar ?? ""}
                  onChange={(ev) => cambiar({ resaltar: ev.target.value }, "resaltar", ev.target.value)}
                  className={claseSelect}
                  aria-label="Departamento resaltado"
                >
                  {departamentos.map(([slug, nombre]) => (
                    <option key={slug} value={slug}>
                      {nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
          </div>

          <button
            type="button"
            onClick={() => {
              setParams({}, { replace: true });
              track("explorador_cambio", { control: "reiniciar", valor: "" });
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 bg-white transition-colors"
          >
            <RotateCcw size={12} />
            Reiniciar
          </button>
        </aside>

        {/* ── Gráfica ── */}
        <section className="min-w-0 rounded-xl border border-border bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-lg text-foreground leading-snug">{titulo}</h2>
              <p className="text-xs text-muted-foreground font-body mt-0.5">
                {hayFiltros ? `${totalLugares} de ${new Set(filas.map((f) => f.id)).size}` : totalLugares}{" "}
                {unidad}
                {e.tipo === "evolucion" && evolucion && evolucion.total > evolucion.lineas.length
                  ? ` · se muestran ${evolucion.lineas.length} de ${evolucion.total} con datos`
                  : ""}
                {e.tipo === "ranking" && e.limite !== null && ranking.length === e.limite
                  ? ` · se muestran los ${e.limite} ${e.orden === "desc" ? "más altos" : "más bajos"}`
                  : ""}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={copiarEnlace}
                className="inline-flex items-center gap-1.5 text-xs font-body border border-border rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiado ? <Check size={12} /> : <Link2 size={12} />}
                {copiado ? "Copiado" : "Copiar enlace"}
              </button>
              <button
                type="button"
                onClick={descargarCsv}
                disabled={vacia}
                className="inline-flex items-center gap-1.5 text-xs font-body border border-border rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <Download size={12} />
                CSV
              </button>
              <button
                type="button"
                onClick={() => setVerTabla((t) => !t)}
                aria-pressed={verTabla}
                className={`inline-flex items-center gap-1.5 text-xs font-body border rounded-md px-2.5 py-1.5 transition-colors ${
                  verTabla
                    ? "border-selva text-selva bg-selva/5"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 size={12} />
                Tabla
              </button>
            </div>
          </div>

          {/* Resumen de la vista */}
          {resumen && !vacia && (
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { k: "Promedio", val: formatearValor(resumen.promedio, v.formato) },
                { k: "Mediana", val: formatearValor(resumen.mediana, v.formato) },
                {
                  k: "Más alto",
                  val: formatearValor(resumen.max.valor, v.formato),
                  sub: resumen.max.nombre,
                },
                {
                  k: "Más bajo",
                  val: formatearValor(resumen.min.valor, v.formato),
                  sub: resumen.min.nombre,
                },
              ].map((s) => (
                <div key={s.k} className="rounded-md bg-muted/50 px-3 py-2 min-w-0">
                  <dt className="text-[11px] text-muted-foreground font-body">
                    {s.k}
                    {e.tipo === "evolucion" && evolucion ? ` · ${evolucion.anios[evolucion.anios.length - 1]}` : ""}
                  </dt>
                  <dd className="font-display font-semibold text-foreground tabular-nums">{s.val}</dd>
                  {s.sub && <dd className="text-[11px] text-muted-foreground font-body truncate">{s.sub}</dd>}
                </div>
              ))}
            </dl>
          )}

          {leyenda.length > 0 && !vacia && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {leyenda.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
              {e.tipo === "evolucion" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                  <span className="w-4 border-t-2 border-dashed" style={{ borderColor: PROMEDIO }} />
                  Promedio de la selección
                </span>
              )}
            </div>
          )}

          {cargando ? (
            <div className="h-96 bg-muted rounded-lg animate-pulse" />
          ) : vacia ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
              <p className="font-display font-semibold text-foreground">Nada que graficar con estos filtros</p>
              <p className="text-sm text-muted-foreground font-body mt-1 max-w-md mx-auto">
                {aniosConDato.length === 0
                  ? `${v.label} no tiene datos a nivel de ${unidad}.`
                  : e.tipo !== "evolucion" && !aniosConDato.includes(e.anio)
                  ? `${v.label} no tiene datos para ${e.anio}. Años con datos: ${aniosConDato.join(", ")}.`
                  : e.tipo === "dispersion" && !disponiblesAnio.has(e.x)
                  ? `${vx.label} no tiene datos para ${e.anio}.`
                  : "Ningún lugar cumple los filtros. Prueba a quitar alguno o a ampliar el rango."}
              </p>
            </div>
          ) : e.tipo === "ranking" ? (
            <ResponsiveContainer width="100%" height={Math.max(260, ranking.length * 28 + 40)}>
              <BarChart data={ranking} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 4 }} barSize={18}>
                <CartesianGrid horizontal={false} stroke="#EDE8E0" />
                <XAxis
                  type="number"
                  {...ejeBonito(ranking.map((p) => p.valor), true)}
                  tickFormatter={formatoEje(v)}
                  tick={{ fontSize: 11, fontFamily: "inherit" }}
                  stroke="#B8B0A3"
                />
                <YAxis
                  type="category"
                  dataKey="etiqueta"
                  width={anchoEtiquetas}
                  interval={0}
                  tickFormatter={recortar}
                  tick={{ fontSize: 11, fontFamily: "inherit" }}
                  stroke="#B8B0A3"
                />
                <Tooltip content={<TooltipPunto v={v} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                <Bar
                  dataKey="valor"
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                  label={{
                    position: "right",
                    fontSize: 11,
                    fontFamily: "inherit",
                    fill: "#64748b",
                    formatter: (n: number) => formatearValor(n, v.formato),
                  }}
                  onClick={(d: Punto) => irAFicha(d.fila.ruta)}
                  style={{ cursor: "pointer" }}
                >
                  {ranking.map((p) => (
                    <Cell key={p.fila.id} fill={p.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : e.tipo === "dispersion" ? (
            <>
              <ResponsiveContainer width="100%" height={460}>
                <ScatterChart margin={{ top: 8, right: 24, left: 8, bottom: 36 }}>
                  <CartesianGrid stroke="#EDE8E0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    {...ejeBonito(dispersion.map((p) => p.x!))}
                    tickFormatter={formatoEje(vx)}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#B8B0A3"
                    label={{ value: vx.label, position: "insideBottom", offset: -24, fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="valor"
                    {...ejeBonito(dispersion.map((p) => p.valor))}
                    tickFormatter={formatoEje(v)}
                    width={56}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#B8B0A3"
                    label={{ value: v.label, angle: -90, position: "insideLeft", offset: 0, fontSize: 12, fill: "#64748b", style: { textAnchor: "middle" } }}
                  />
                  <Tooltip content={<TooltipPunto v={v} x={vx} />} cursor={{ strokeDasharray: "3 3" }} />
                  <Scatter
                    data={dispersion}
                    isAnimationActive={false}
                    onClick={(d: Punto) => irAFicha(d.fila.ruta)}
                    style={{ cursor: "pointer" }}
                    shape={(props: { cx?: number; cy?: number; payload?: Punto }) => (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={e.nivel === "departamentos" ? 6 : 4.5}
                        fill={props.payload?.color}
                        fillOpacity={0.85}
                        stroke="#fff"
                        strokeWidth={1.5}
                      />
                    )}
                  />
                </ScatterChart>
              </ResponsiveContainer>
              {r !== null && (
                <p className="text-xs text-muted-foreground font-body">
                  Correlación (r de Pearson):{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {r.toLocaleString("es-GT", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                  </span>{" "}
                  ·{" "}
                  {Math.abs(r) >= 0.7
                    ? "relación fuerte"
                    : Math.abs(r) >= 0.4
                    ? "relación moderada"
                    : Math.abs(r) >= 0.2
                    ? "relación débil"
                    : "sin relación lineal clara"}
                  {Math.abs(r) >= 0.2 ? (r > 0 ? ", en el mismo sentido" : ", en sentido contrario") : ""}.
                  Correlación no implica causa.
                </p>
              )}
            </>
          ) : (
            evolucion && (
              <ResponsiveContainer width="100%" height={440}>
                <LineChart data={evolucion.datos} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                  <CartesianGrid stroke="#EDE8E0" />
                  <XAxis
                    type="number"
                    dataKey="anio"
                    domain={["dataMin", "dataMax"]}
                    ticks={evolucion.anios}
                    tickFormatter={String}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#B8B0A3"
                    padding={{ left: 16, right: 16 }}
                  />
                  <YAxis
                    {...ejeBonito(
                      evolucion.datos.flatMap((d) =>
                        Object.entries(d)
                          .filter(([k]) => k !== "anio")
                          .map(([, val]) => val)
                      )
                    )}
                    tickFormatter={formatoEje(v)}
                    width={56}
                    tick={{ fontSize: 11, fontFamily: "inherit" }}
                    stroke="#B8B0A3"
                  />
                  <Tooltip
                    content={
                      <TooltipEvolucion
                        v={v}
                        nombres={new Map(evolucion.lineas.map((l) => [l.id, l.nombre]))}
                      />
                    }
                  />
                  {evolucion.lineas.map((l) => (
                    <Line
                      key={l.id}
                      dataKey={l.id}
                      stroke={l.color}
                      strokeWidth={resaltado(l.fila) && e.color !== "uno" ? 2.5 : 2}
                      strokeOpacity={l.color === APAGADO ? 0.9 : evolucion.lineas.length > 12 && e.color === "uno" ? 0.55 : 0.9}
                      dot={{ r: 3, fill: l.color, strokeWidth: 0 }}
                      activeDot={{ r: 5, onClick: () => irAFicha(l.fila.ruta), style: { cursor: "pointer" } }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                  <Line
                    dataKey="__promedio"
                    stroke={PROMEDIO}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )
          )}

          {!vacia && !cargando && (
            <p className="text-xs text-muted-foreground font-body">
              {e.tipo === "evolucion"
                ? "Los años están a escala: la distancia entre puntos es el tiempo real transcurrido."
                : "Haz clic en una barra o un punto para abrir su ficha."}
              {e.nivel === "municipios" && e.tipo === "evolucion"
                ? ` Solo ${conSerie} de los ${municipios?.length ?? 340} municipios tienen datos de años anteriores a 2025.`
                : ""}
            </p>
          )}

          {verTabla && !vacia && (
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-sm font-body">
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    {tabla.columnas.map((c, i) => (
                      <th key={c} className={`px-3 py-2 font-medium ${i >= 2 ? "text-right" : "text-left"}`}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tabla.filas.map((f, i) => (
                    <tr key={i} className="border-t border-border">
                      {f.map((celda, j) => (
                        <td
                          key={j}
                          className={`px-3 py-1.5 ${j >= 2 ? "text-right tabular-nums" : ""} ${
                            j === 0 ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {celda}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
