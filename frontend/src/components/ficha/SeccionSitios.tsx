import { Link } from "react-router-dom";
import { ChevronRight, Landmark } from "lucide-react";
import type { Sitio } from "@/types/sitio";
import { track } from "@/lib/analytics";

/**
 * Lista de los sitios de interés del departamento: una fila por sitio, con el
 * enlace a su ficha. Deliberadamente compacta — el informe completo (calidad del
 * agua, monitoreo, recomendaciones) vive en `/sitio/:slug`, para que la ficha
 * departamental siga siendo sobre sus indicadores.
 */
export default function SeccionSitios({
  sitios,
  departamento,
}: {
  sitios: Sitio[];
  departamento: string;
}) {
  if (sitios.length === 0) return null;

  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display font-semibold text-base text-foreground mb-1 flex items-center gap-2">
        <Landmark size={15} className="text-lago shrink-0" />
        Sitios de interés
      </h2>
      <p className="text-xs text-muted-foreground font-body mb-4">
        Lugares de {departamento} con ficha propia.
      </p>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm font-body min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="font-normal text-xs text-muted-foreground pb-2 pr-4">Sitio</th>
              <th className="font-normal text-xs text-muted-foreground pb-2 pr-4">Tipo</th>
              <th className="font-normal text-xs text-muted-foreground pb-2 pr-4">
                Dato principal
              </th>
              <th className="font-normal text-xs text-muted-foreground pb-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {sitios.map((s) => (
              <tr
                key={s.slug}
                className="border-b border-border/60 last:border-0 group hover:bg-muted/40 transition-colors"
              >
                <td className="py-2.5 pr-4 align-top">
                  <Link
                    to={`/sitio/${s.slug}`}
                    onClick={() =>
                      track("navegar_a_ficha", {
                        destino: `/sitio/${s.slug}`,
                        origen: "sitios_del_depto",
                      })
                    }
                    className="font-medium text-foreground group-hover:text-selva transition-colors"
                  >
                    {s.nombre}
                  </Link>
                  <span className="block text-xs text-muted-foreground leading-snug mt-0.5 max-w-md">
                    {s.resumen}
                  </span>
                </td>
                <td className="py-2.5 pr-4 align-top">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                    {s.tipo}
                  </span>
                </td>
                <td className="py-2.5 pr-4 align-top">
                  {s.dato_clave && (
                    <>
                      <span className="text-foreground tabular-nums">{s.dato_clave}</span>
                      {s.dato_clave_label && (
                        <span className="block text-xs text-muted-foreground leading-snug">
                          {s.dato_clave_label}
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="py-2.5 align-top text-right">
                  <Link
                    to={`/sitio/${s.slug}`}
                    aria-label={`Ver la ficha de ${s.nombre}`}
                    className="inline-flex text-muted-foreground group-hover:text-selva transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
