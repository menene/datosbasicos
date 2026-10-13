import { Download, ExternalLink, FileText } from "lucide-react";
import { ANEXOS, DOCUMENTOS_REFERENCIA } from "@/data/anexos";
import type { Anexo } from "@/data/anexos";
import { track } from "@/lib/analytics";

const VERTIENTES: Anexo["vertiente"][] = ["Pacífico", "Caribe", "Golfo de México"];

// Fuera de /anexos/ a propósito: una carpeta con la misma ruta que la página haría
// que un servidor estático respondiera /anexos con el directorio.
const urlDe = (a: Anexo) => `/archivos/anexos/${a.slug}.pdf`;

export default function AnexosPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* ── Header ── */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-screen-lg mx-auto px-6 py-14">
          <span className="inline-block text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full bg-lago/10 text-lago border border-lago/20 mb-5">
            Documentos
          </span>
          <h1 className="font-display font-bold text-foreground text-3xl mb-3">
            Anexos
          </h1>
          <p className="font-body text-muted-foreground text-[15px] leading-relaxed max-w-2xl">
            Estudios hidrosociales y planes de gestión de las cuencas de Guatemala,
            organizados por vertiente. Cada documento reúne la caracterización física,
            la dimensión social, la calidad del agua y la gobernanza de sus cuencas.
          </p>
        </div>
      </section>

      {/* ── Lista por vertiente ── */}
      <section className="max-w-screen-lg mx-auto px-6 py-12 space-y-12">
        {VERTIENTES.map((vertiente) => (
          <div key={vertiente}>
            <h2 className="font-display font-semibold text-foreground text-lg mb-4">
              Vertiente del {vertiente}
            </h2>
            <ul className="space-y-3">
              {ANEXOS.filter((a) => a.vertiente === vertiente).map((a) => (
                <li
                  key={a.slug}
                  className="rounded-xl border border-border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-lg bg-lago/10 text-lago flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-body font-medium tracking-wide uppercase text-lago mb-0.5">
                      Anexo {a.numero}
                    </p>
                    <h3 className="font-display font-semibold text-foreground leading-snug">
                      {a.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed mt-1">
                      {a.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-body mt-1.5">
                      PDF · {a.paginas} páginas · {a.kb} KB
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <a
                      href={urlDe(a)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("anexo_abierto", { anexo: a.slug })}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-medium rounded-md px-3 py-1.5 bg-lago text-white hover:bg-lago-dark transition-colors"
                    >
                      <ExternalLink size={12} />
                      Ver
                    </a>
                    <a
                      href={urlDe(a)}
                      download
                      onClick={() => track("anexo_descargado", { anexo: a.slug })}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
                    >
                      <Download size={12} />
                      Descargar
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Documentos de otros autores, ofrecidos como descarga */}
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg mb-1">
            Documentos de referencia
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-4">
            Publicaciones de otras instituciones y autores, disponibles para descargar.
          </p>
          <ul className="space-y-3">
            {DOCUMENTOS_REFERENCIA.map((d) => (
              <li
                key={d.slug}
                className="rounded-xl border border-border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="w-11 h-11 rounded-lg bg-selva/10 text-selva flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground leading-snug">
                    {d.titulo}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body mt-0.5">{d.autores}</p>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed mt-1">
                    {d.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground/80 font-body mt-1.5">
                    PDF · {d.paginas} páginas · {d.mb.toLocaleString("es-GT")} MB
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("anexo_abierto", { anexo: d.slug })}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-medium rounded-md px-3 py-1.5 bg-selva text-white hover:bg-selva/90 transition-colors"
                  >
                    <ExternalLink size={12} />
                    Ver
                  </a>
                  <a
                    href={d.url}
                    download
                    onClick={() => track("anexo_descargado", { anexo: d.slug })}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
                  >
                    <Download size={12} />
                    Descargar
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
