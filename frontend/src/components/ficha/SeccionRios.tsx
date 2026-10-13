import { Waves } from "lucide-react";
import type { Rio } from "@/types/rio";

const NUM = new Intl.NumberFormat("es-GT");

/**
 * Ríos cuya cuenca drena el departamento, con sus cifras de cuenca y la carga
 * contaminante que publica el estudio hidrosocial de su vertiente. Un río aparece
 * en la ficha de cada departamento que atraviesa (el Motagua, en trece).
 */
export default function SeccionRios({
  rios,
  departamento,
}: {
  rios: Rio[];
  departamento: string;
}) {
  if (rios.length === 0) return null;

  return (
    <section className="border-t border-border pt-6">
      <h2 className="font-display font-semibold text-base text-foreground mb-1 flex items-center gap-2">
        <Waves size={15} className="text-lago shrink-0" />
        Ríos y cuencas
      </h2>
      <p className="text-xs text-muted-foreground font-body mb-4">
        {rios.length === 1 ? "El río principal" : `Los ${rios.length} ríos principales`} cuya
        cuenca drena {departamento}. Las cifras son de la cuenca completa, no solo del
        tramo departamental.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {rios.map((r) => (
          <article key={r.slug} className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display font-semibold text-foreground">{r.nombre}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-lago/10 text-lago whitespace-nowrap">
                Vertiente del {r.vertiente}
              </span>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 mb-3">
              <Dato label="Cuenca" valor={r.cuenca_km2} unidad="km²" />
              <Dato label="Longitud" valor={r.longitud_km} unidad="km" />
              <Dato label="Caudal medio" valor={r.caudal_m3s} unidad="m³/s" nota={r.caudal_nota} />
              <Dato label="Población" valor={r.poblacion_cuenca} unidad="hab." />
            </dl>

            {r.desembocadura && (
              <p className="text-xs text-muted-foreground font-body mb-2">
                <span className="text-foreground">Desemboca en:</span> {r.desembocadura}
              </p>
            )}

            {(r.calidad || r.carga_valor) && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 rounded-lg bg-muted/40 px-3 py-2 mb-2">
                {r.calidad && (
                  <p className="text-xs font-body">
                    <span className="text-muted-foreground">Calidad del agua: </span>
                    <span className="text-foreground font-medium">{r.calidad}</span>
                  </p>
                )}
                {r.carga_valor && (
                  <p className="text-xs font-body">
                    <span className="text-foreground font-medium tabular-nums">{r.carga_valor}</span>
                    <span className="text-muted-foreground"> de {r.carga_label}</span>
                  </p>
                )}
              </div>
            )}

            {r.problematica && (
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                {r.problematica}
              </p>
            )}
            {r.fuente && (
              <p className="text-[10px] text-muted-foreground/70 font-body mt-2">
                Fuente: {r.fuente}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function Dato({
  label,
  valor,
  unidad,
  nota,
}: {
  label: string;
  valor: number | null;
  unidad: string;
  nota?: string | null;
}) {
  return (
    <div title={nota ?? undefined}>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground font-body">{label}</dt>
      <dd className="text-sm text-foreground tabular-nums font-body">
        {valor !== null ? `${NUM.format(valor)} ${unidad}` : "—"}
      </dd>
    </div>
  );
}
