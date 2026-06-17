import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { ANIOS_DISPONIBLES, useFiltros } from "@/store/filtros";

function etiquetaSeleccion(anios: number[]): string {
  if (anios.length === 0) return "Ninguno";
  if (anios.length === 1) return String(anios[0]);
  if (anios.length === ANIOS_DISPONIBLES.length) return "Todos";
  return anios.join(", ");
}

export default function SelectorAniosMulti({
  className = "",
}: {
  className?: string;
}) {
  const anios = useFiltros((s) => s.anios);
  const toggleAnio = useFiltros((s) => s.toggleAnio);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-2 pl-2.5 pr-2 py-1.5 text-sm font-body font-medium border border-border rounded-md bg-background text-foreground hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-selva data-[state=open]:ring-1 data-[state=open]:ring-selva data-[state=open]:border-selva transition-colors ${className}`}
          aria-label="Seleccionar años"
        >
          <Calendar size={14} className="text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide hidden sm:inline">
            Año
          </span>
          <span className="text-selva tabular-nums">
            {etiquetaSeleccion(anios)}
          </span>
          <ChevronDown
            size={14}
            className="text-muted-foreground shrink-0 transition-transform data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-md border border-border bg-white shadow-lg p-1 font-body text-sm
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                     data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Mostrar datos de
          </div>
          {ANIOS_DISPONIBLES.map((a) => {
            const selected = anios.includes(a);
            const isOnly = selected && anios.length === 1;
            return (
              <DropdownMenu.CheckboxItem
                key={a}
                checked={selected}
                disabled={isOnly}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => toggleAnio(a)}
                className={`relative flex items-center gap-2 pl-8 pr-3 py-1.5 rounded-sm cursor-pointer outline-none select-none
                            ${selected ? "text-selva font-medium" : "text-foreground"}
                            data-[highlighted]:bg-selva/10
                            data-[disabled]:opacity-60 data-[disabled]:cursor-not-allowed`}
              >
                <DropdownMenu.ItemIndicator className="absolute left-2 inline-flex items-center justify-center">
                  <Check size={14} className="text-selva" />
                </DropdownMenu.ItemIndicator>
                <span className="tabular-nums">{a}</span>
              </DropdownMenu.CheckboxItem>
            );
          })}
          <div className="px-2 pt-1.5 pb-0.5 text-[10px] text-muted-foreground/80 leading-snug">
            Selecciona uno o varios años.
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
