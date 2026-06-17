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
import { useFiltros } from "@/store/filtros";
import SelectorAniosMulti from "@/components/SelectorAniosMulti";
import { formatearValor } from "@/lib/utils";
import { VARIABLES } from "@/types/departamento";
import type { Indicadores, VariableKey } from "@/types/departamento";

interface Row {
  slug: string;
  nombre: string;
  region: string | null;
  superficie_km2: number | null;
  /** anio → indicadores (or null if missing for that year) */
  porAnio: Record<number, Indicadores | null>;
}

const COLUMNAS_TEXTO = new Set(["nombre", "region"]);
const TEXT_COL_IDS = COLUMNAS_TEXTO;
const esTexto = (id: string) => TEXT_COL_IDS.has(id);

const columnHelper = createColumnHelper<Row>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp size={13} className="text-selva" />;
  if (sorted === "desc") return <ArrowDown size={13} className="text-selva" />;
  return <ArrowUpDown size={13} className="text-muted-foreground/50" />;
}

function valorDe(
  row: Row,
  key: VariableKey,
  anio: number
): number | null {
  const ind = row.porAnio[anio];
  const v = ind?.[key];
  return typeof v === "number" ? v : null;
}

export default function TablaPage() {
  const navigate = useNavigate();
  const anios = useFiltros((s) => s.anios);
  const multiAnio = anios.length > 1;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: porAnio, isLoading } = useDepartamentosMulti(anios);

  // Pivot: one row per departamento; values keyed by year
  const data = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    // Walk all years; first year's metadata wins for nombre/region/superficie.
    for (const { anio, data: deptos } of porAnio) {
      for (const d of deptos) {
        let r = map.get(d.slug);
        if (!r) {
          r = {
            slug: d.slug,
            nombre: d.nombre,
            region: d.region,
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

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => {
    const cols: ColumnDef<Row, unknown>[] = [
      columnHelper.accessor("nombre", {
        header: "Departamento",
        cell: (info) => (
          <button
            onClick={() => navigate(`/ficha/${info.row.original.slug}`)}
            className="flex items-center gap-1 font-medium text-selva hover:underline text-left"
          >
            {info.getValue() as string}
            <ExternalLink size={11} className="shrink-0 opacity-60" />
          </button>
        ),
        enableSorting: true,
      }) as ColumnDef<Row, unknown>,
      columnHelper.accessor("region", {
        header: "Región",
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
          return v !== null
            ? new Intl.NumberFormat("es-GT").format(v)
            : "—";
        },
        enableSorting: true,
      }) as ColumnDef<Row, unknown>,
    ];

    for (const v of VARIABLES) {
      if (multiAnio) {
        // Group header: variable label. Children: one column per year.
        cols.push(
          columnHelper.group({
            id: v.key,
            header: v.label,
            columns: anios.map(
              (anio) =>
                columnHelper.accessor(
                  (row) => valorDe(row, v.key, anio),
                  {
                    id: `${v.key}__${anio}`,
                    header: String(anio),
                    cell: (info) =>
                      formatearValor(info.getValue() as number | null, v.formato),
                    enableSorting: true,
                    sortUndefined: "last" as const,
                  }
                ) as ColumnDef<Row, unknown>
            ),
          }) as ColumnDef<Row, unknown>
        );
      } else {
        const onlyAnio = anios[0];
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
  }, [navigate, multiAnio, anios]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const descargarExcel = () => {
    const filas = table.getRowModel().rows.map((row) => {
      const r = row.original;
      const fila: Record<string, string | number | null> = {
        Departamento: r.nombre,
        "Región": r.region ?? null,
        "Superficie (km²)": r.superficie_km2,
      };
      for (const v of VARIABLES) {
        if (multiAnio) {
          for (const anio of anios) {
            fila[`${v.label} (${anio})`] = valorDe(r, v.key, anio);
          }
        } else {
          fila[v.label] = valorDe(r, v.key, anios[0]);
        }
      }
      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(filas);
    const colWidths = Object.keys(filas[0] ?? {}).map((key) => ({
      wch: Math.max(key.length + 2, 14),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    const sheetName = `Departamentos ${anios.join("-")}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `guatemala-departamentos-${anios.join("-")}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-2xl mx-auto px-6 py-12 animate-pulse space-y-3">
        <div className="h-8 bg-muted rounded w-64" />
        <div className="h-10 bg-muted rounded" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-6 py-8">
      {/* Header + controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-xl text-foreground">
            Datos por departamento
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {table.getRowModel().rows.length} de {data.length} departamentos ·{" "}
            {anios.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SelectorAniosMulti />
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar departamento…"
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

      {/* Table */}
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
                    // Sub-year headers look like "v.key__2025"
                    const isYearLeaf = id.includes("__");
                    const isText = esTexto(id);
                    const centrada = !isText;
                    const colSpan = header.colSpan;
                    const isGroupHeader = header.subHeaders.length > 0;

                    return (
                      <th
                        key={header.id}
                        colSpan={colSpan}
                        className={`px-3 py-2.5 font-medium text-xs text-muted-foreground font-body whitespace-nowrap select-none ${
                          centrada ? "text-center" : "text-left"
                        } ${
                          isGroupHeader
                            ? "border-b border-border bg-muted/70"
                            : ""
                        } ${
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
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                  i % 2 === 0 ? "" : "bg-muted/10"
                }`}
              >
                {row.getVisibleCells().map((cell) => {
                  const id = cell.column.id;
                  const isText = esTexto(id);
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
    </div>
  );
}
