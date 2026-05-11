import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import MapaChoropleth from "@/components/mapa/MapaChoropleth";
import PanelDepartamento from "@/components/mapa/PanelDepartamento";
import LeyendaColor from "@/components/mapa/LeyendaColor";
import { useFiltros } from "@/store/filtros";
import { useSeleccion } from "@/store/seleccion";
import { VARIABLES } from "@/types/departamento";

export default function MapaPage() {
  const { variableActiva, setVariable } = useFiltros();
  const { departamentoActivo } = useSeleccion();

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* ── Mapa ── */}
      <div className="flex-1 flex relative min-w-0">
        <MapaChoropleth />
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col border-l border-border bg-white overflow-hidden">
        {/* Variable selector */}
        <div className="p-4 border-b border-border">
          <label className="block text-xs font-medium text-muted-foreground font-body mb-1.5">
            Variable
          </label>
          <div className="relative">
            <select
              value={variableActiva}
              onChange={(e) => setVariable(e.target.value as typeof variableActiva)}
              className="w-full appearance-none bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-selva cursor-pointer pr-8"
            >
              {VARIABLES.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        {/* Leyenda siempre visible */}
        <LeyendaColor />

        {/* Panel del departamento seleccionado */}
        <AnimatePresence>
          {departamentoActivo && <PanelDepartamento key={departamentoActivo} />}
        </AnimatePresence>

        {/* Placeholder cuando no hay selección */}
        {!departamentoActivo && (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-xs text-muted-foreground text-center font-body leading-relaxed">
              Haz clic en un departamento para ver sus indicadores
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
