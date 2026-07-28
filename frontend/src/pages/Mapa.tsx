import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import MapaChoropleth from "@/components/mapa/MapaChoropleth";
import MapaMunicipios from "@/components/mapa/MapaMunicipios";
import PanelDepartamento from "@/components/mapa/PanelDepartamento";
import PanelMunicipio from "@/components/mapa/PanelMunicipio";
import LeyendaColor from "@/components/mapa/LeyendaColor";
import { ANIOS_DISPONIBLES, useFiltros } from "@/store/filtros";
import { useSeleccion } from "@/store/seleccion";
import { VARIABLES } from "@/types/departamento";

type Tab = "departamentos" | "municipios";

export default function MapaPage() {
  const { variableActiva, setVariable } = useFiltros();
  const anioMapa = useFiltros((s) => s.anioMapa);
  const setAnioMapa = useFiltros((s) => s.setAnioMapa);
  const { departamentoActivo, municipioActivo, setDepartamentoActivo, setMunicipioActivo } =
    useSeleccion();
  const [tab, setTab] = useState<Tab>("departamentos");

  const esMunicipios = tab === "municipios";
  const seleccionActiva = esMunicipios ? municipioActivo : departamentoActivo;

  // Switching views clears the other view's selection so panels don't leak across.
  function cambiarTab(next: Tab) {
    if (next === tab) return;
    setDepartamentoActivo(null);
    setMunicipioActivo(null);
    setTab(next);
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">
      {/* ── Mapa ── */}
      <div className="flex-1 flex relative min-w-0">
        {/* Selector de vista (Departamentos / Municipios) */}
        <div className="absolute top-4 left-4 z-10 inline-flex rounded-lg border border-border bg-white/90 backdrop-blur-sm p-0.5 shadow-sm">
          {([
            { key: "departamentos", label: "Departamentos" },
            { key: "municipios", label: "Municipios" },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => cambiarTab(t.key)}
              className={`px-3 py-1.5 text-sm font-body rounded-md transition-colors ${
                tab === t.key
                  ? "bg-selva text-white font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {esMunicipios ? <MapaMunicipios /> : <MapaChoropleth />}
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-72 shrink-0 flex flex-col border-l border-border bg-white overflow-hidden">
        <div className="p-4 border-b border-border space-y-4">
          <p>
            {esMunicipios
              ? "Selecciona una variable para colorear los municipios 👇🏽"
              : "Selecciona una variable para visualizarla en el mapa 👇🏽"}
          </p>

          <div>
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

          <div>
            <label className="block text-xs font-medium text-muted-foreground font-body mb-1.5">
              Año
            </label>
            <div className="relative">
              <select
                value={anioMapa}
                onChange={(e) => setAnioMapa(Number(e.target.value))}
                className="w-full appearance-none bg-muted border border-border rounded-md px-3 py-2 text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-selva cursor-pointer pr-8"
              >
                {ANIOS_DISPONIBLES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Leyenda de color (misma escala en ambas vistas) */}
        <LeyendaColor municipios={esMunicipios} />

        {/* Panel de la selección activa (departamento o municipio) */}
        <AnimatePresence mode="wait">
          {esMunicipios
            ? municipioActivo && <PanelMunicipio key={`m-${municipioActivo}`} />
            : departamentoActivo && <PanelDepartamento key={`d-${departamentoActivo}`} />}
        </AnimatePresence>

        {/* Placeholder cuando no hay selección */}
        {!seleccionActiva && (
          <div className="flex-1 flex items-center justify-center p-3">
            <p className="text-xs text-muted-foreground text-center font-body leading-relaxed">
              👈🏽 Haz clic en {esMunicipios ? "un municipio" : "un departamento"} para ver
              sus indicadores
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
