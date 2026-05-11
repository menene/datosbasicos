import { useMemo } from "react";
import * as d3 from "d3";
import { useFiltros } from "@/store/filtros";
import { useResumenIndicadores } from "@/api/departamentos";
import { getEscala, COLOR_SIN_DATO } from "@/lib/colores";
import { VARIABLES } from "@/types/departamento";
import { formatearValor } from "@/lib/utils";

const STEPS = 5;

export default function LeyendaColor() {
  const { variableActiva, anio } = useFiltros();
  const { data: resumen } = useResumenIndicadores(anio);

  const variableInfo = VARIABLES.find((v) => v.key === variableActiva);

  const { dominio, swatches } = useMemo(() => {
    const r = resumen?.find((item) => item.campo === variableActiva);
    const dom: [number, number] =
      r && r.minimo !== null && r.maximo !== null ? [r.minimo, r.maximo] : [0, 1];
    const escala = getEscala(variableActiva, dom);
    const ticks = d3.range(STEPS).map((i) => dom[0] + (i / (STEPS - 1)) * (dom[1] - dom[0]));
    const items = ticks.map((val) => ({
      color: escala(val),
      label: formatearValor(val, variableInfo?.formato ?? "decimal"),
    }));
    return { dominio: dom, swatches: items };
  }, [resumen, variableActiva, variableInfo]);

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
