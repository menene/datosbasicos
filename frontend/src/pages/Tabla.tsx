import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Search,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDepartamentosMulti } from "@/api/departamentos";
import { useMunicipios } from "@/api/municipios";
import { useFiltros } from "@/store/filtros";
import SelectorAniosMulti from "@/components/SelectorAniosMulti";
import { formatearValor } from "@/lib/utils";
import { track, trackDebounced } from "@/lib/analytics";
import { agregarNacional } from "@/lib/totales";
import type { AgregadoNacional } from "@/lib/totales";
import { VARIABLES } from "@/types/departamento";
import type { Indicadores, Variable, VariableKey } from "@/types/departamento";

const FORMATO_POR_KEY: Record<string, Variable["formato"]> = Object.fromEntries(
  VARIABLES.map((v) => [v.key, v.formato])
);

type Vista = "departamentos" | "municipios";

// Synthetic single-snapshot year used for municipios (they have no year dimension).
const ANIO_MUNI = 2026;

// The subset of VARIABLES that municipios actually carry.
const MUNI_KEYS = new Set<VariableKey>([
  "poblacion_total",
  "densidad_hab_km2",
  "pct_urbana",
  "pct_rural",
  "pct_indigena",
  "pct_hombres",
  "pct_mujeres",
  "analfabetismo_pct",
  "acceso_agua_pct",
  "acceso_saneamiento_pct",
  "esperanza_vida",
  "fecundidad",
  "crecimiento_anual_pct",
  "tiempo_duplicacion_anios",
  "poblacion_activa",
]);

interface Row {
  slug: string;
  nombre: string;
  /** Region (departamentos) or parent department name (municipios). */
  grupo: string | null;
  /** Set for municipios so the name cell can link to the municipio ficha. */
  departamentoSlug?: string;
  superficie_km2: number | null;
  /** anio → indicadores (or null if missing for that year) */
  porAnio: Record<number, Indicadores | null>;
}

const TEXT_COL_IDS = new Set(["nombre", "grupo"]);
const esTexto = (id: string) => TEXT_COL_IDS.has(id);

const columnHelper = createColumnHelper<Row>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp size={13} className="text-selva" />;
  if (sorted === "desc") return <ArrowDown size={13} className="text-selva" />;
  return <ArrowUpDown size={13} className="text-muted-foreground/50" />;
}

function valorDe(row: Row, key: VariableKey, anio: number): number | null {
  const ind = row.porAnio[anio];
  const v = ind?.[key];
  return typeof v === "number" ? v : null;
}

export default function TablaPage() {
  const navigate = useNavigate();
  const anios = useFiltros((s) => s.anios);
  const [vista, setVista] = useState<Vista>("departamentos");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const esMunicipios = vista === "municipios";
  const aniosEfectivos = esMunicipios ? [ANIO_MUNI] : anios;
  const multiAnio = !esMunicipios && anios.length > 1;
  const variablesPosibles = useMemo<Variable[]>(
    () => (esMunicipios ? VARIABLES.filter((v) => MUNI_KEYS.has(v.key)) : VARIABLES),
    [esMunicipios]
  );

  const { data: porAnio, isLoading: deptLoading } = useDepartamentosMulti(anios);
  const { data: municipios, isLoading: muniLoading } = useMunicipios();
  const isLoading = esMunicipios ? muniLoading : deptLoading;

  const grupoLabel = esMunicipios ? "Departamento" : "Región";
  const entidadLabel = esMunicipios ? "Municipio" : "Departamento";

  // Pivot departamentos: one row per departamento, values keyed by year.
  const dataDeptos = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const { anio, data: deptos } of porAnio) {
      for (const d of deptos) {
        let r = map.get(d.slug);
        if (!r) {
          r = {
            slug: d.slug,
            nombre: d.nombre,
            grupo: d.region,
            superficie_km2: d.superficie_km2,
            porAnio: {},
          };
          map.set(d.slug, r);
        }
        r.porAnio[anio] = d.indicadores;
      }
    }
    return Array.from(map.values());
  }, [porAnio]);

  // Municipios: one row each; the municipio itself doubles as its Indicadores
  // (shared field names) under the synthetic snapshot year.
  const dataMunis = useMemo<Row[]>(
    () =>
      (municipios ?? []).map((m) => ({
        slug: m.slug,
        nombre: m.nombre,
        grupo: m.departamento,
        departamentoSlug: m.departamento_slug,
        superficie_km2: m.superficie_km2,
        porAnio: { [ANIO_MUNI]: m as unknown as Indicadores },
      })),
    [municipios]
  );

  const data = esMunicipios ? dataMunis : dataDeptos;

  // Un indicador sin un solo dato en los años elegidos se omite: una columna entera
  // de guiones no informa y empuja fuera de pantalla a las que sí tienen datos.
  const variablesActivas = useMemo(
    () =>
      variablesPosibles.filter((v) =>
        data.some((r) => aniosEfectivos.some((a) => valorDe(r, v.key, a) !== null))
      ),
    [variablesPosibles, data, aniosEfectivos]
  );

  // National total per year (sum for additive keys, simple average otherwise).
  // Computed over the full dataset — the country total is independent of search.
  const agregadoPorAnio = useMemo<Record<number, AgregadoNacional>>(() => {
    const out: Record<number, AgregadoNacional> = {};
    for (const anio of aniosEfectivos) {
      out[anio] = agregarNacional(
        data.map((r) => ({
          ...(r.porAnio[anio] ?? {}),
          superficie_km2: r.superficie_km2,
        }))
      );
    }
    return out;
  }, [data, aniosEfectivos]);

  const anioBase = aniosEfectivos[0];

  const celdaTotal = (colId: string): React.ReactNode => {
    if (colId === "nombre")
      return <span className="font-semibold text-selva">Guatemala</span>;
    if (colId === "grupo")
      return <span className="text-muted-foreground text-xs">Total nacional</span>;
    if (colId === "superficie_km2") {
      const sup = agregadoPorAnio[anioBase]?.superficie_km2 ?? null;
      return sup !== null ? new Intl.NumberFormat("es-GT").format(sup) : "—";
    }
    let key = colId as VariableKey;
    let anio = anioBase;
    if (colId.includes("__")) {
      const [k, a] = colId.split("__");
      key = k as VariableKey;
      anio = Number(a);
    }
    const val = agregadoPorAnio[anio]?.valores[key] ?? null;
    return formatearValor(val, FORMATO_POR_KEY[key]);
  };

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => {
    const cols: ColumnDef<Row, unknown>[] = [
      columnHelper.accessor("nombre", {
        header: entidadLabel,
        cell: (info) => {
          const r = info.row.original;
          const to = r.departamentoSlug
            ? `/ficha/${r.departamentoSlug}/${r.slug}`
            : `/ficha/${r.slug}`;
          return (
            <button
              onClick={() => {
                track("navegar_a_ficha", { destino: to, origen: "tabla" });
                navigate(to);
              }}
              className="flex items-center gap-1 font-medium text-selva hover:underline text-left"
            >
              {info.getValue() as string}
              <ExternalLink size={11} className="shrink-0 opacity-60" />
            </button>
          );
        },
        enableSorting: true,
      }) as ColumnDef<Row, unknown>,
      columnHelper.accessor("grupo", {
        id: "grupo",
        header: grupoLabel,
        cell: (info) => (
          <span className="text-muted-foreground text-xs">
            {(info.getValue() as string | null) ?? "—"}
          </span>
        ),
        enableSorting: true,
      }) as ColumnDef<Row, unknown>,
      columnHelper.accessor((row) => row.superficie_km2, {
        id: "superficie_km2",
        header: "Superficie (km²)",
        cell: (info) => {
          const v = info.getValue() as number | null;
          return v !== null ? new Intl.NumberFormat("es-GT").format(v) : "—";
        },
        enableSorting: true,
      }) as ColumnDef<Row, unknown>,
    ];

    for (const v of variablesActivas) {
      if (multiAnio) {
        cols.push(
          columnHelper.group({
            id: v.key,
            header: v.label,
            columns: anios.map(
              (anio) =>
                columnHelper.accessor((row) => valorDe(row, v.key, anio), {
                  id: `${v.key}__${anio}`,
                  header: String(anio),
                  cell: (info) =>
                    formatearValor(info.getValue() as number | null, v.formato),
                  enableSorting: true,
                  sortUndefined: "last" as const,
                }) as ColumnDef<Row, unknown>
            ),
          }) as ColumnDef<Row, unknown>
        );
      } else {
        const onlyAnio = aniosEfectivos[0];
        cols.push(
          columnHelper.accessor((row) => valorDe(row, v.key, onlyAnio), {
            id: v.key,
            header: v.label,
            cell: (info) =>
              formatearValor(info.getValue() as number | null, v.formato),
            enableSorting: true,
            sortUndefined: "last" as const,
          }) as ColumnDef<Row, unknown>
        );
      }
    }

    return cols;
  }, [navigate, multiAnio, anios, aniosEfectivos, variablesActivas, entidadLabel, grupoLabel]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: (updater) => {
      const siguiente =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(siguiente);
      const col = siguiente[0];
      if (col) {
        track("tabla_orden", {
          columna: col.id,
          direccion: col.desc ? "desc" : "asc",
          vista,
        });
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const descargarExcel = () => {
    track("exportar_xlsx", {
      vista,
      filas: table.getRowModel().rows.length,
      anios: aniosEfectivos.join(","),
    });
    const filas = table.getRowModel().rows.map((row) => {
      const r = row.original;
      const fila: Record<string, string | number | null> = {
        [entidadLabel]: r.nombre,
        [grupoLabel]: r.grupo ?? null,
        "Superficie (km²)": r.superficie_km2,
      };
      for (const v of variablesActivas) {
        if (multiAnio) {
          for (const anio of anios) {
            fila[`${v.label} (${anio})`] = valorDe(r, v.key, anio);
          }
        } else {
          fila[v.label] = valorDe(r, v.key, aniosEfectivos[0]);
        }
      }
      return fila;
    });

    // Prepend the national total row.
    const totalFila: Record<string, string | number | null> = {
      [entidadLabel]: "Guatemala (total nacional)",
      [grupoLabel]: null,
      "Superficie (km²)": agregadoPorAnio[anioBase]?.superficie_km2 ?? null,
    };
    for (const v of variablesActivas) {
      if (multiAnio) {
        for (const anio of anios) {
          totalFila[`${v.label} (${anio})`] =
            agregadoPorAnio[anio]?.valores[v.key] ?? null;
        }
      } else {
        totalFila[v.label] = agregadoPorAnio[anioBase]?.valores[v.key] ?? null;
      }
    }
    filas.unshift(totalFila);

    const ws = XLSX.utils.json_to_sheet(filas);
    ws["!cols"] = Object.keys(filas[0] ?? {}).map((key) => ({
      wch: Math.max(key.length + 2, 14),
    }));

    const wb = XLSX.utils.book_new();
    const sufijo = esMunicipios ? "2026" : anios.join("-");
    const sheetName = `${esMunicipios ? "Municipios" : "Departamentos"} ${sufijo}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(
      wb,
      `guatemala-${esMunicipios ? "municipios" : "departamentos"}-${sufijo}.xlsx`
    );
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Vista toggle (Departamentos / Municipios) — fixed at top so it never shifts */}
      <div className="mb-4">
        <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
          {(
            [
              { key: "departamentos", label: "Departamentos" },
              { key: "municipios", label: "Municipios" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (t.key === vista) return;
                setVista(t.key);
                setSorting([]);
                track("tabla_vista", { vista: t.key });
              }}
              className={`px-4 py-1.5 text-sm font-body rounded-md transition-colors ${
                vista === t.key
                  ? "bg-selva text-white font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-xl text-foreground">
            Datos por {esMunicipios ? "municipio" : "departamento"}
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {table.getRowModel().rows.length} de {data.length}{" "}
            {esMunicipios ? "municipios" : "departamentos"}
            {!esMunicipios && ` · ${anios.join(", ")}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!esMunicipios && <SelectorAniosMulti origen="tabla" />}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={globalFilter}
              onChange={(e) => {
                const termino = e.target.value;
                setGlobalFilter(termino);
                // Debounce: emitir por pulsación produciría ruido inservible.
                if (termino.trim().length >= 2) {
                  trackDebounced("tabla_busqueda", {
                    termino: termino.trim().toLowerCase(),
                    vista,
                  });
                }
              }}
              placeholder={`Buscar ${esMunicipios ? "municipio" : "departamento"}…`}
              className="pl-8 pr-3 py-1.5 text-sm font-body border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-selva w-56"
            />
          </div>
          <button
            onClick={descargarExcel}
            disabled={table.getRowModel().rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-body border border-border rounded-md bg-background text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Descargar tabla como Excel"
          >
            <Download size={14} />
            Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-muted rounded" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted rounded" />
          ))}
        </div>
      ) : (
        /* Table */
        <div className="w-full overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg, hgIdx) => {
                const isLastRow = hgIdx === table.getHeaderGroups().length - 1;
                return (
                  <tr
                    key={hg.id}
                    className={`bg-muted/50 ${isLastRow ? "border-b border-border" : ""}`}
                  >
                    {hg.headers.map((header) => {
                      const id = header.column.id;
                      const isYearLeaf = id.includes("__");
                      const isText = esTexto(id);
                      const centrada = !isText;
                      const isGroupHeader = header.subHeaders.length > 0;

                      return (
                        <th
                          key={header.id}
                          colSpan={header.colSpan}
                          className={`px-3 py-2.5 font-medium text-xs text-muted-foreground font-body whitespace-nowrap select-none ${
                            centrada ? "text-center" : "text-left"
                          } ${isGroupHeader ? "border-b border-border bg-muted/70" : ""} ${
                            isYearLeaf ? "text-[11px]" : ""
                          }`}
                          style={{
                            minWidth: id === "nombre" ? 160 : isYearLeaf ? 76 : 110,
                          }}
                        >
                          {header.isPlaceholder ? null : isGroupHeader ? (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )
                          ) : (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className={`flex items-center gap-1 hover:text-foreground transition-colors ${
                                centrada ? "mx-auto" : ""
                              }`}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              <SortIcon sorted={header.column.getIsSorted()} />
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                );
              })}
            </thead>
            <tbody>
              {data.length > 0 && (
                <tr className="border-b-2 border-selva/30 bg-selva/[0.06] font-medium">
                  {table.getVisibleLeafColumns().map((col) => {
                    const centrada = !esTexto(col.id);
                    return (
                      <td
                        key={col.id}
                        className={`px-3 py-2.5 font-body whitespace-nowrap text-foreground ${
                          centrada ? "text-center tabular-nums" : ""
                        }`}
                      >
                        {celdaTotal(col.id)}
                      </td>
                    );
                  })}
                </tr>
              )}
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                    i % 2 === 0 ? "" : "bg-muted/10"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isText = esTexto(cell.column.id);
                    const centrada = !isText;
                    return (
                      <td
                        key={cell.id}
                        className={`px-3 py-2 font-body whitespace-nowrap text-foreground ${
                          centrada ? "text-center tabular-nums" : ""
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && data.length > 0 && (
        <p className="text-[11px] text-muted-foreground/80 font-body mt-3 leading-snug max-w-3xl">
          La fila <span className="text-selva font-medium">Guatemala</span> es el
          total nacional: población y superficie son sumas de{" "}
          {esMunicipios ? "los 340 municipios" : "los 22 departamentos"}; los
          porcentajes y tasas son promedios simples (sin ponderar por población),
          por lo que son aproximados. El ranking IDH no se totaliza.
        </p>
      )}
    </div>
  );
}
