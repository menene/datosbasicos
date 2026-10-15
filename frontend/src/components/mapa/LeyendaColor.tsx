import { useMemo } from "react";
import * as d3 from "d3";
import { useFiltros } from "@/store/filtros";
import { useResumenIndicadores } from "@/api/departamentos";
import { useMunicipios, municipiosDominio } from "@/api/municipios";
import { getEscala, COLOR_SIN_DATO, NIVELES_VULNERABILIDAD } from "@/lib/colores";
import { TODAS_LAS_VARIABLES } from "@/types/departamento";
import { formatearValor } from "@/lib/utils";

const STEPS = 5;

export default function LeyendaColor({ municipios = false }: { municipios?: boolean }) {
  const variableActiva = useFiltros((s) => s.variableActiva);
  const anio = useFiltros((s) => s.anioMapa);
  const { data: resumen } = useResumenIndicadores(anio);
  const { data: municipiosData } = useMunicipios();

  const variableInfo = TODAS_LAS_VARIABLES.find((v) => v.key === variableActiva);

  const { dominio, swatches } = useMemo(() => {
    let dom: [number, number];
    if (municipios) {
      dom = municipiosDominio(municipiosData, variableActiva) ?? [0, 1];
    } else {
      const r = resumen?.find((item) => item.campo === variableActiva);
      dom = r && r.minimo !== null && r.maximo !== null ? [r.minimo, r.maximo] : [0, 1];
    }
    const escala = getEscala(variableActiva, dom);
    const ticks = d3.range(STEPS).map((i) => dom[0] + (i / (STEPS - 1)) * (dom[1] - dom[0]));
    const items = ticks.map((val) => ({
      color: escala(val),
      label: formatearValor(val, variableInfo?.formato ?? "decimal"),
    }));
    return { dominio: dom, swatches: items };
  }, [municipios, municipiosData, resumen, variableActiva, variableInfo]);

  // Variable por niveles: un color fijo por categoría, no una rampa.
  const conteoNiveles = useMemo(() => {
    if (variableInfo?.formato !== "nivel") return null;
    const conteo = NIVELES_VULNERABILIDAD.map(() => 0);
    for (const m of municipiosData ?? []) {
      if (m.vulnerabilidad_nivel) conteo[m.vulnerabilidad_nivel - 1] += 1;
    }
    return conteo;
  }, [variableInfo, municipiosData]);

  if (conteoNiveles) {
    return (
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground font-body mb-2">
          {variableInfo?.label}
        </p>
        <ul className="space-y-1">
          {NIVELES_VULNERABILIDAD.map((n, i) => (
            <li key={n.categoria} className="flex items-center gap-2">
              <span className="w-4 h-3 rounded-sm shrink-0" style={{ backgroundColor: n.color }} />
              <span className="text-[11px] text-foreground font-body flex-1">{n.etiqueta}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {conteoNiveles[i]} municipios
              </span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted-foreground/70 font-body mt-2 leading-snug">
          Suma ponderada de seis ámbitos, Censo 2018. Fuente: Tercero et al., Clavius
          (2023), Universidad Rafael Landívar.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground font-body mb-2">
        {variableInfo?.label ?? variableActiva}
      </p>
      <div className="flex items-center gap-1">
        {swatches.map(({ color }, i) => (
          <div
            key={i}
            className="flex-1 h-3 rounded-sm first:rounded-l last:rounded-r"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">
          {formatearValor(dominio[0], variableInfo?.formato ?? "decimal")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {formatearValor(dominio[1], variableInfo?.formato ?? "decimal")}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <div
          className="w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: COLOR_SIN_DATO }}
        />
        <span className="text-[10px] text-muted-foreground">Sin dato</span>
      </div>
    </div>
  );
}
