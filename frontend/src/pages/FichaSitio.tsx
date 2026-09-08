import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { useSitio } from "@/api/sitios";
import { useLago } from "@/api/lagos";
import { track } from "@/lib/analytics";
import SeccionLago from "@/components/ficha/SeccionLago";
import Breadcrumb from "@/components/ficha/Breadcrumb";

/**
 * Ficha de un sitio de interés. Aquí vive el informe largo que antes se metía en
 * la ficha del departamento: esa solo lista los sitios y enlaza a esta página.
 *
 * El detalle sale de donde diga el sitio: los lagos tienen su propio dataset
 * (`detalle: "lago"`), y cualquier otro sitio se describe con sus `secciones`.
 */
export default function FichaSitioPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: sitio, isLoading, isError } = useSitio(slug);
  const { data: lago } = useLago(sitio?.detalle === "lago" ? sitio.detalle_slug : null);

  useEffect(() => {
    if (!slug) return;
    track("ficha_sitio", { sitio: slug });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !sitio) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <p className="text-sm text-muted-foreground font-body">Sitio no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: "Fichas", to: "/ficha" },
          { label: sitio.departamento, to: `/ficha/${sitio.departamento_slug}` },
          { label: sitio.nombre },
        ]}
      />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body transition-colors -mt-4"
      >
        <ArrowLeft size={14} />
        Volver
      </button>

      {/* Header */}
      <div className="space-y-2">
        <span className="inline-block text-[11px] font-body tracking-widest uppercase px-2.5 py-1 rounded-full bg-lago/10 text-lago border border-lago/20">
          {sitio.tipo}
        </span>
        <h1 className="font-display font-semibold text-3xl text-foreground leading-tight">
          {sitio.nombre}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground font-body flex-wrap">
          <Link
            to={`/ficha/${sitio.departamento_slug}`}
            className="flex items-center gap-1 hover:text-selva transition-colors"
          >
            <MapPin size={13} />
            {sitio.departamento}
          </Link>
          {sitio.ubicacion && <span>{sitio.ubicacion}</span>}
        </div>
        <p className="text-sm text-muted-foreground font-body leading-relaxed max-w-2xl border-l-2 border-border pl-3 mt-3">
          {sitio.resumen}
        </p>
      </div>

      {/* Detalle especializado: el informe completo del lago */}
      {lago && <SeccionLago lago={lago} mostrarEncabezado={false} />}

      {/* Detalle genérico, para sitios sin dataset propio */}
      {!lago && sitio.secciones.length > 0 && (
        <div className="border-t border-border pt-6 space-y-6">
          {sitio.secciones.map((s) => (
            <div key={s.titulo}>
              <h2 className="font-display font-semibold text-base text-foreground mb-2">
                {s.titulo}
              </h2>
              {s.parrafos.map((p) => (
                <p
                  key={p}
                  className="text-sm text-muted-foreground font-body leading-relaxed mb-2 max-w-3xl"
                >
                  {p}
                </p>
              ))}
              {s.items.length > 0 && (
                <ul className="text-sm text-muted-foreground font-body leading-relaxed list-disc pl-4 space-y-1">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {!lago && sitio.secciones.length === 0 && (
        <p className="text-xs text-muted-foreground/70 font-body italic border-t border-border pt-6">
          La ficha ampliada de este sitio todavía está en preparación.
        </p>
      )}

      <div className="border-t border-border pt-6">
        <Link
          to={`/ficha/${sitio.departamento_slug}`}
          className="text-sm font-body text-selva hover:text-selva-light transition-colors"
        >
          ← Volver a la ficha de {sitio.departamento}
        </Link>
      </div>
    </div>
  );
}
