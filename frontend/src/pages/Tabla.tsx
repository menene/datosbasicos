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
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Search } from "lucide-react";
import { useDepartamentos } from "@/api/departamentos";
import { formatearValor } from "@/lib/utils";
import { VARIABLES } from "@/types/departamento";
import type { Departamento } from "@/types/departamento";

const ANIO = 2025;

type Row = Departamento & { [key: string]: unknown };

const columnHelper = createColumnHelper<Row>();

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp size={13} className="text-selva" />;
  if (sorted === "desc") return <ArrowDown size={13} className="text-selva" />;
  return <ArrowUpDown size={13} className="text-muted-foreground/50" />;
}

export default function TablaPage() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data: departamentos, isLoading } = useDepartamentos({ anio: ANIO });

  const data = useMemo<Row[]>(
    () => (departamentos as Row[]) ?? [],
    [departamentos]
  );

  const columns = useMemo(
    () => [
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
      }),
      columnHelper.accessor("region", {
        header: "Región",
        cell: (info) => (
          <span className="text-muted-foreground text-xs">
            {(info.getValue() as string | null) ?? "—"}
          </span>
        ),
        enableSorting: true,
      }),
      columnHelper.accessor(
        (row) => (row.superficie_km2 as number | null),
        {
          id: "superficie_km2",
          header: "Superficie (km²)",
          cell: (info) => {
            const v = info.getValue() as number | null;
            return v !== null
              ? new Intl.NumberFormat("es-GT").format(v)
              : "—";
          },
          enableSorting: true,
        }
      ),
      ...VARIABLES.map((v) =>
        columnHelper.accessor(
          (row) => {
            const ind = (row as Departamento).indicadores;
            const val = ind?.[v.key];
            return typeof val === "number" ? val : null;
          },
          {
            id: v.key,
            header: v.label,
            cell: (info) =>
              formatearValor(info.getValue() as number | null, v.formato),
            enableSorting: true,
            sortUndefined: "last" as const,
          }
        )
      ),
    ],
    [navigate]
  );

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
      {/* Header + search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-xl text-foreground">
            Datos por departamento
          </h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            {table.getRowModel().rows.length} de {data.length} departamentos · {ANIO}
          </p>
        </div>
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
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-muted/50 border-b border-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left font-medium text-xs text-muted-foreground font-body whitespace-nowrap select-none"
                    style={{ minWidth: header.id === "nombre" ? 160 : 110 }}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIcon sorted={header.column.getIsSorted()} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b border-border last:border-0 transition-colors hover:bg-muted/30 ${
                  i % 2 === 0 ? "" : "bg-muted/10"
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 font-body whitespace-nowrap text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
