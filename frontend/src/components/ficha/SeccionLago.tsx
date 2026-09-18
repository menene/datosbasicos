import { Droplets, FlaskConical, AlertTriangle, Microscope, ExternalLink } from "lucide-react";
import type { Lago } from "@/types/lago";
import { colorNivel, etiquetaNivel } from "@/lib/lagos";

const numero = (n: number) => new Intl.NumberFormat("es-GT").format(n);

/** [etiqueta, valor] de la rejilla de datos generales. */
type Dato = [string, string];

function Bloque({
  titulo,
  icon,
  children,
}: {
  titulo: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-display font-semibold text-sm text-foreground mb-2 flex items-center gap-1.5">
        {icon}
        {titulo}
      </h3>
      {children}
    </div>
  );
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="text-sm text-muted-foreground font-body leading-relaxed list-disc pl-4 space-y-1">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/**
 * Informe del lago del departamento. Cada bloque se dibuja solo si la fuente lo
 * documenta: Atitlán trae el informe completo del CEA-UVG (monitoreo, líneas de
 * investigación, conclusiones y recomendaciones); los otros tres, el cuadro
 * comparativo de calidad del agua.
 */
export default function SeccionLago({
  lago,
  mostrarEncabezado = true,
}: {
  lago: Lago;
  /** En la ficha del sitio el nombre y el tipo ya están en la cabecera de la página. */
  mostrarEncabezado?: boolean;
}) {
  const datos: Dato[] = [
    lago.area_km2 != null ? (["Superficie lacustre", `${numero(lago.area_km2)} km²`] as Dato) : null,
    lago.cuenca_km2 != null ? (["Cuenca completa", `${numero(lago.cuenca_km2)} km²`] as Dato) : null,
    lago.altitud_texto ? (["Altitud", lago.altitud_texto] as Dato) : null,
    lago.profundidad_texto ? (["Profundidad máxima", lago.profundidad_texto] as Dato) : null,
    lago.dimensiones ? (["Dimensiones", lago.dimensiones] as Dato) : null,
    lago.poblacion_cuenca != null
      ? (["Población de la cuenca", `≈ ${numero(lago.poblacion_cuenca)} personas`] as Dato)
      : null,
    lago.clasificacion_trofica
      ? (["Clasificación trófica", lago.clasificacion_trofica] as Dato)
      : null,
    lago.ica ? (["Índice de calidad del agua (ICA)", lago.ica] as Dato) : null,
  ].filter((d): d is Dato => d !== null);

  const notas = [lago.area_nota, lago.cuenca_nota].filter((t): t is string => !!t);

  return (
    <section id="lago" className="border-t border-border pt-6 scroll-mt-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        {mostrarEncabezado ? (
          <h2 className="font-display font-semibold text-base text-foreground flex items-center gap-2">
            <Droplets size={16} className="text-lago shrink-0" />
            {lago.nombre}
          </h2>
        ) : (
          <span />
        )}
        {lago.nivel_contaminacion && (
          <span
            className="text-[11px] font-body font-medium px-2.5 py-1 rounded-full border"
            style={{
              color: colorNivel(lago.nivel_contaminacion),
              borderColor: `${colorNivel(lago.nivel_contaminacion)}55`,
              background: `${colorNivel(lago.nivel_contaminacion)}12`,
            }}
          >
            Contaminación:{" "}
            {lago.nivel_contaminacion_texto ?? etiquetaNivel(lago.nivel_contaminacion)}
          </span>
        )}
      </div>
      {mostrarEncabezado && lago.tipo && (
        <p className="text-xs text-muted-foreground font-body mb-4">{lago.tipo}</p>
      )}

      <div className="space-y-6 mt-4">
        {/* Datos generales */}
        {datos.length > 0 && (
          <div>
            <dl className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {datos.map(([label, valor]) => (
                <div key={label} className="bg-muted/50 rounded-md px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground font-body mb-0.5">{label}</dt>
                  <dd className="font-display font-semibold text-foreground text-sm leading-tight">
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>
            {notas.length > 0 && (
              <ul className="text-[11px] text-muted-foreground/80 font-body mt-2 leading-snug space-y-0.5">
                {notas.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Parámetros medidos */}
        {lago.parametros.length > 0 && (
          <Bloque
            titulo="Parámetros del agua"
            icon={<FlaskConical size={14} className="text-lago" />}
          >
            <div className="w-full overflow-x-auto">
              <table className="text-sm font-body min-w-[420px]">
                <tbody>
                  {lago.parametros.map((p) => (
                    <tr key={p.label} className="border-b border-border/60 last:border-0">
                      <th className="text-left font-normal text-muted-foreground py-1.5 pr-6 align-top">
                        {p.label}
                        {p.periodo && (
                          <span className="text-[11px] text-muted-foreground/70 ml-1.5">
                            {p.periodo}
                          </span>
                        )}
                      </th>
                      <td className="py-1.5 text-foreground font-medium tabular-nums align-top">
                        {p.valor}
                        {p.detalle && (
                          <span className="block text-[11px] font-normal text-muted-foreground/80 mt-0.5">
                            {p.detalle}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bloque>
        )}

        {/* Diagnóstico */}
        {lago.diagnostico.length > 0 && (
          <Bloque titulo="Diagnóstico">
            <Lista items={lago.diagnostico} />
          </Bloque>
        )}

        {/* Fuentes de contaminación */}
        {lago.fuentes_contaminacion.length > 0 && (
          <Bloque
            titulo="Fuentes de contaminación"
            icon={<AlertTriangle size={14} className="text-tierra" />}
          >
            <Lista items={lago.fuentes_contaminacion} />
          </Bloque>
        )}

        {/* Monitoreo */}
        {lago.monitoreo && (
          <Bloque
            titulo={lago.monitoreo.titulo}
            icon={<Microscope size={14} className="text-selva" />}
          >
            <dl className="text-sm font-body space-y-1.5">
              <div className="flex gap-2 flex-wrap">
                <dt className="text-muted-foreground">Alianza:</dt>
                <dd className="text-foreground">{lago.monitoreo.alianza}</dd>
              </div>
              <div className="flex gap-2 flex-wrap">
                <dt className="text-muted-foreground">Frecuencia:</dt>
                <dd className="text-foreground">{lago.monitoreo.frecuencia}</dd>
              </div>
              <div className="flex gap-2 flex-wrap">
                <dt className="text-muted-foreground">Sitios:</dt>
                <dd className="text-foreground">{lago.monitoreo.sitios.join(" · ")}</dd>
              </div>
              <div className="flex gap-2 flex-wrap">
                <dt className="text-muted-foreground">Mide:</dt>
                <dd className="text-foreground">{lago.monitoreo.mide.join(", ")}</dd>
              </div>
              {lago.monitoreo.base_historica && (
                <div className="flex gap-2 flex-wrap">
                  <dt className="text-muted-foreground">Base histórica:</dt>
                  <dd className="text-foreground">{lago.monitoreo.base_historica}</dd>
                </div>
              )}
            </dl>
          </Bloque>
        )}

        {/* Líneas de investigación */}
        {lago.investigacion.length > 0 && (
          <Bloque titulo="Líneas actuales de investigación">
            <div className="grid gap-3 sm:grid-cols-3">
              {lago.investigacion.map((g) => (
                <div key={g.area} className="border border-border rounded-lg p-3">
                  <p className="font-display font-semibold text-xs text-foreground mb-1.5">
                    {g.area}
                  </p>
                  <ul className="text-xs text-muted-foreground font-body leading-relaxed space-y-1">
                    {g.lineas.map((l) => (
                      <li key={l}>· {l}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Bloque>
        )}

        {/* Estado actual */}
        {lago.estado_actual && (
          <div className="rounded-lg border border-lago/25 bg-lago/[0.04] p-3">
            <p className="text-[11px] uppercase tracking-widest font-body text-lago mb-1">
              Estado actual
            </p>
            <p className="text-sm text-foreground font-body leading-relaxed">
              {lago.estado_actual}
            </p>
            {lago.tendencia && (
              <p className="text-xs text-muted-foreground font-body mt-1.5">
                Tendencia: {lago.tendencia}
              </p>
            )}
          </div>
        )}

        {/* Conclusiones y recomendaciones */}
        {(lago.conclusiones.length > 0 || lago.recomendaciones.length > 0) && (
          <div className="grid gap-6 sm:grid-cols-2">
            {lago.conclusiones.length > 0 && (
              <Bloque titulo="Conclusiones">
                <Lista items={lago.conclusiones} />
              </Bloque>
            )}
            {lago.recomendaciones.length > 0 && (
              <Bloque titulo="Recomendaciones">
                <Lista items={lago.recomendaciones} />
              </Bloque>
            )}
          </div>
        )}

        {/* Créditos y fuentes */}
        {(lago.institucion || lago.fuentes.length > 0) && (
          <div className="border-t border-border pt-3 space-y-1">
            {lago.institucion && (
              <p className="text-[11px] text-muted-foreground font-body leading-snug">
                {lago.institucion}
              </p>
            )}
            {lago.fuentes.map((f) =>
              f.url ? (
                <a
                  key={f.nombre}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-selva hover:text-selva-light font-body transition-colors w-fit"
                >
                  {f.nombre}
                  <ExternalLink size={10} />
                </a>
              ) : (
                <p
                  key={f.nombre}
                  className="text-[11px] text-muted-foreground/80 font-body leading-snug"
                >
                  Fuente: {f.nombre}
                </p>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
