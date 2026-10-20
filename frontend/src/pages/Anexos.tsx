import { useSearchParams } from "react-router-dom";
import {
  Download,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import {
  ANEXOS,
  DOCUMENTOS_REFERENCIA,
  INFOGRAFIAS,
  NOTICIAS,
  RECURSOS_EN_LINEA,
} from "@/data/anexos";
import type { Anexo } from "@/data/anexos";
import { track, trackDebounced } from "@/lib/analytics";

const VERTIENTES: Anexo["vertiente"][] = ["Pacífico", "Caribe", "Golfo de México"];

// Filtros de la página. La categoría y la búsqueda van en la URL
// (?categoria=infografias&q=cuenca) para que una vista filtrada se pueda compartir
// como enlace.
const CATEGORIAS = [
  { key: "todos", label: "Todos" },
  { key: "estudios", label: "Estudios hidrosociales" },
  { key: "infografias", label: "Infografías" },
  { key: "noticias", label: "Noticias" },
  { key: "referencias", label: "Documentos de referencia" },
  { key: "en-linea", label: "Recursos en línea" },
] as const;
type Categoria = (typeof CATEGORIAS)[number]["key"];

// Búsqueda sin distinguir mayúsculas ni tildes ("malnutricion" encuentra
// «Malnutrición»). Cada palabra debe aparecer en alguno de los campos.
const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function coincide(palabras: string[], ...campos: Array<string | undefined>): boolean {
  if (palabras.length === 0) return true;
  const texto = normalizar(campos.filter(Boolean).join(" "));
  return palabras.every((p) => texto.includes(p));
}

const FECHA = new Intl.DateTimeFormat("es-GT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fechaLarga = (iso: string) => FECHA.format(new Date(`${iso}T00:00:00Z`));

// Fuera de /anexos/ a propósito: una carpeta con la misma ruta que la página haría
// que un servidor estático respondiera /anexos con el directorio.
const urlDe = (a: Anexo) => `/archivos/anexos/${a.slug}.pdf`;

export default function AnexosPage() {
  const [params, setParams] = useSearchParams();
  const categoria: Categoria =
    CATEGORIAS.find((c) => c.key === params.get("categoria"))?.key ?? "todos";
  const busqueda = params.get("q") ?? "";
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);

  const anexos = ANEXOS.filter((a) =>
    coincide(palabras, `Anexo ${a.numero}`, a.titulo, a.descripcion, `Vertiente del ${a.vertiente}`)
  );
  const infografias = INFOGRAFIAS.filter((i) =>
    coincide(palabras, i.titulo, i.autor, i.descripcion)
  );
  const noticias = NOTICIAS.filter((n) =>
    coincide(palabras, n.titulo, n.bajada, n.medio, n.autor, n.tituloInterior)
  );
  const referencias = DOCUMENTOS_REFERENCIA.filter((d) =>
    coincide(palabras, d.titulo, d.autores, d.descripcion)
  );
  const recursos = RECURSOS_EN_LINEA.filter((r) =>
    coincide(palabras, r.titulo, r.institucion, r.descripcion)
  );

  const conteos: Record<Exclude<Categoria, "todos">, number> = {
    estudios: anexos.length,
    infografias: infografias.length,
    noticias: noticias.length,
    referencias: referencias.length,
    "en-linea": recursos.length,
  };
  const total = Object.values(conteos).reduce((suma, n) => suma + n, 0);
  const conteo = (c: Categoria) => (c === "todos" ? total : conteos[c]);
  const ver = (c: Exclude<Categoria, "todos">) =>
    (categoria === "todos" || categoria === c) && conteos[c] > 0;

  function actualizar(cambios: { categoria?: Categoria; q?: string }) {
    const siguiente = { categoria, q: busqueda, ...cambios };
    const p: Record<string, string> = {};
    if (siguiente.categoria !== "todos") p.categoria = siguiente.categoria;
    if (siguiente.q) p.q = siguiente.q;
    setParams(p, { replace: true });
  }

  function buscar(termino: string) {
    actualizar({ q: termino });
    // Debounce: emitir por pulsación produciría ruido inservible.
    if (termino.trim().length >= 2) {
      trackDebounced("anexos_busqueda", { termino: termino.trim().toLowerCase() });
    }
  }

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
            organizados por vertiente, junto con infografías propias, noticias de prensa,
            documentos de referencia y recursos en línea de otras instituciones.
          </p>
        </div>
      </section>

      {/* ── Búsqueda y filtros por categoría (fijos bajo el encabezado del sitio) ── */}
      <div className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-screen-lg mx-auto px-6 pt-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => buscar(e.target.value)}
              placeholder="Buscar documentos por título, autor o tema…"
              aria-label="Buscar documentos"
              className="w-full pl-9 pr-9 py-2 text-sm font-body border border-border rounded-md bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-selva [&::-webkit-search-cancel-button]:hidden"
            />
            {busqueda && (
              <button
                onClick={() => actualizar({ q: "" })}
                aria-label="Borrar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Filtrar documentos por categoría"
          className="max-w-screen-lg mx-auto px-6 py-3 flex gap-2 overflow-x-auto"
        >
          {CATEGORIAS.map((c) => {
            const activa = categoria === c.key;
            return (
              <button
                key={c.key}
                role="tab"
                aria-selected={activa}
                onClick={() => actualizar({ categoria: c.key })}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-body transition-colors ${
                  activa
                    ? "bg-selva border-selva text-white font-medium"
                    : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {c.label}
                <span
                  className={`text-[11px] tabular-nums rounded-full px-1.5 ${
                    activa ? "bg-white/20" : "bg-muted"
                  }`}
                >
                  {conteo(c.key)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Lista por vertiente ── */}
      <section className="max-w-screen-lg mx-auto px-6 py-12 space-y-12">
        {/* Sin resultados para la búsqueda en la categoría elegida */}
        {conteo(categoria) === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <p className="font-display font-semibold text-foreground">
              Ningún documento coincide con «{busqueda.trim()}»
            </p>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {categoria !== "todos" && total > 0
                ? `Hay ${total} ${total === 1 ? "resultado" : "resultados"} en otras categorías.`
                : "Prueba con otras palabras o revisa la ortografía."}
            </p>
            <div className="flex justify-center gap-2 mt-4">
              {categoria !== "todos" && total > 0 && (
                <button
                  onClick={() => actualizar({ categoria: "todos" })}
                  className="text-xs font-body font-medium rounded-md px-3 py-1.5 bg-selva text-white hover:bg-selva/90 transition-colors"
                >
                  Ver en todas las categorías
                </button>
              )}
              <button
                onClick={() => actualizar({ q: "" })}
                className="text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
              >
                Borrar búsqueda
              </button>
            </div>
          </div>
        )}

        {ver("estudios") && VERTIENTES.filter((v) => anexos.some((a) => a.vertiente === v)).map(
          (vertiente) => (
          <div key={vertiente}>
            <h2 className="font-display font-semibold text-foreground text-lg mb-4">
              Vertiente del {vertiente}
            </h2>
            <ul className="space-y-3">
              {anexos.filter((a) => a.vertiente === vertiente).map((a) => (
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
          )
        )}

        {/* Infografías propias: miniatura, ver a tamaño completo o descargar */}
        {ver("infografias") && (
          <div>
            <h2 className="font-display font-semibold text-foreground text-lg mb-1">
              Infografías
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Elaboradas para Guatemala Datos Básicos.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {infografias.map((inf) => (
                <li
                  key={inf.slug}
                  className="rounded-xl border border-border bg-white p-4 flex gap-4"
                >
                  <a
                    href={inf.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("anexo_abierto", { anexo: inf.slug })}
                    className="shrink-0 w-24 self-start rounded-md overflow-hidden border border-border bg-muted"
                  >
                    <img
                      src={inf.miniatura ?? inf.url}
                      alt={inf.titulo}
                      loading="lazy"
                      className="w-full h-auto"
                    />
                  </a>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <h3 className="font-display font-semibold text-foreground leading-snug">
                      {inf.titulo}
                    </h3>
                    {inf.autor && (
                      <p className="text-sm text-muted-foreground font-body mt-0.5">
                        Por {inf.autor}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground font-body leading-relaxed mt-1">
                      {inf.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-body mt-1.5">
                      {inf.formato} · {inf.detalle} · {inf.kb} KB
                    </p>
                    <div className="flex gap-2 mt-auto pt-3">
                      <a
                        href={inf.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("anexo_abierto", { anexo: inf.slug })}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-medium rounded-md px-3 py-1.5 bg-lago text-white hover:bg-lago-dark transition-colors"
                      >
                        <ExternalLink size={12} />
                        Ver
                      </a>
                      <a
                        href={inf.url}
                        download
                        onClick={() => track("anexo_descargado", { anexo: inf.slug })}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
                      >
                        <Download size={12} />
                        Descargar
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Noticias de prensa: la nota en línea y las páginas impresas escaneadas */}
        {ver("noticias") && (
          <div>
            <h2 className="font-display font-semibold text-foreground text-lg mb-1">
              Noticias
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Notas de prensa sobre temas de Guatemala Datos Básicos.
            </p>
            <ul className="space-y-3">
              {noticias.map((n) => (
                <li
                  key={n.slug}
                  className="rounded-xl border border-border bg-white p-5 flex flex-col sm:flex-row gap-4"
                >
                  <a
                    href={n.paginas[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("anexo_abierto", { anexo: n.slug })}
                    className="shrink-0 sm:w-44 rounded-md overflow-hidden border border-border bg-muted self-start"
                  >
                    <img
                      src={n.paginas[0].url}
                      alt={`${n.titulo} — ${n.medio}, ${n.paginas[0].etiqueta.toLowerCase()}`}
                      loading="lazy"
                      className="w-full h-auto"
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-body font-medium tracking-wide uppercase text-tierra mb-0.5 flex items-center gap-1.5">
                      <Newspaper size={12} />
                      {n.medio} · {fechaLarga(n.fecha)}
                    </p>
                    <h3 className="font-display font-semibold text-foreground leading-snug">
                      {n.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed mt-1">
                      {n.bajada}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-body mt-1.5">
                      «{n.tituloInterior}» · Por {n.autor}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("anexo_abierto", { anexo: n.slug })}
                        className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-medium rounded-md px-3 py-1.5 bg-tierra text-white hover:bg-tierra-dark transition-colors"
                      >
                        <ExternalLink size={12} />
                        Leer en línea
                      </a>
                      {n.paginas.map((pag) => (
                        <a
                          key={pag.url}
                          href={pag.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => track("anexo_abierto", { anexo: n.slug })}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
                        >
                          <ImageIcon size={12} />
                          Impreso · {pag.etiqueta}
                        </a>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Documentos de otros autores, ofrecidos como descarga */}
        {ver("referencias") && (
          <div>
            <h2 className="font-display font-semibold text-foreground text-lg mb-1">
              Documentos de referencia
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Publicaciones de otras instituciones y autores, disponibles para descargar.
            </p>
            <ul className="space-y-3">
              {referencias.map((d) => (
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
        )}

        {/* Sitios externos: se abren en otra pestaña, no hay archivo que descargar */}
        {ver("en-linea") && (
          <div>
            <h2 className="font-display font-semibold text-foreground text-lg mb-1">
              Recursos en línea
            </h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Colecciones y sitios de consulta de otras instituciones.
            </p>
            <ul className="space-y-3">
              {recursos.map((r) => (
                <li
                  key={r.slug}
                  className="rounded-xl border border-border bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-lg bg-tierra/10 text-tierra flex items-center justify-center shrink-0">
                    <Globe size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground leading-snug">
                      {r.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground font-body mt-0.5">{r.institucion}</p>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed mt-1">
                      {r.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground/80 font-body mt-1.5 truncate">
                      {new URL(r.url).hostname}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => track("anexo_abierto", { anexo: r.slug })}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-body font-medium rounded-md px-3 py-1.5 bg-tierra text-white hover:bg-tierra/90 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Abrir
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
