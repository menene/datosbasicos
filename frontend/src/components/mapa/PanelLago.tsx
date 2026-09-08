import { X, MapPin, Droplets, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useLagos } from "@/api/lagos";
import { useSeleccion } from "@/store/seleccion";
import { colorNivel, etiquetaNivel } from "@/lib/lagos";

/** Ficha compacta del lago seleccionado en el mapa. El detalle largo (monitoreo,
 *  investigación, recomendaciones) vive en la ficha del departamento. */
export default function PanelLago() {
  const { lagoActivo, setLagoActivo } = useSeleccion();
  const { data: lagos, isLoading } = useLagos();
  const lago = lagos?.find((l) => l.slug === lagoActivo);

  if (!lagoActivo) return null;

  const numero = (n: number) => new Intl.NumberFormat("es-GT").format(n);

  const datos: Array<[string, string]> = lago
    ? ([
        lago.area_km2 != null ? ["Superficie lacustre", `${numero(lago.area_km2)} km²`] : null,
        lago.cuenca_km2 != null ? ["Cuenca completa", `${numero(lago.cuenca_km2)} km²`] : null,
        lago.altitud_texto ? ["Altitud", lago.altitud_texto] : null,
        lago.profundidad_texto ? ["Profundidad máxima", lago.profundidad_texto] : null,
        lago.dimensiones ? ["Dimensiones", lago.dimensiones] : null,
        lago.poblacion_cuenca != null
          ? ["Población de la cuenca", `≈ ${numero(lago.poblacion_cuenca)}`]
          : null,
        lago.clasificacion_trofica ? ["Clasificación trófica", lago.clasificacion_trofica] : null,
        lago.ica ? ["Índice de calidad del agua", lago.ica] : null,
      ].filter(Boolean) as Array<[string, string]>)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex-1 overflow-y-auto border-t border-border"
    >
      {isLoading || !lago ? (
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-5 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display font-semibold text-foreground text-lg leading-tight flex items-center gap-1.5">
                <Droplets size={15} className="text-lago shrink-0" />
                {lago.nombre}
              </h2>
              <Link
                to={`/ficha/${lago.departamento_slug}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground font-body mt-0.5 hover:text-selva transition-colors"
              >
                <MapPin size={11} />
                {lago.departamento}
              </Link>
            </div>
            <button
              onClick={() => setLagoActivo(null)}
              className="shrink-0 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Nivel de contaminación */}
          {lago.nivel_contaminacion && (
            <div
              className="rounded-md px-3 py-2 border"
              style={{
                borderColor: `${colorNivel(lago.nivel_contaminacion)}55`,
                background: `${colorNivel(lago.nivel_contaminacion)}12`,
              }}
            >
              <p className="text-[11px] uppercase tracking-widest font-body text-muted-foreground">
                Nivel de contaminación
              </p>
              <p
                className="font-display font-semibold text-sm mt-0.5"
                style={{ color: colorNivel(lago.nivel_contaminacion) }}
              >
                {lago.nivel_contaminacion_texto ?? etiquetaNivel(lago.nivel_contaminacion)}
              </p>
            </div>
          )}

          {/* Datos generales */}
          {datos.length > 0 && (
            <dl className="grid grid-cols-2 gap-2">
              {datos.map(([label, valor]) => (
                <div key={label} className="bg-muted/50 rounded-md px-3 py-2.5">
                  <dt className="text-xs text-muted-foreground font-body mb-0.5">{label}</dt>
                  <dd className="font-display font-semibold text-foreground text-sm leading-tight">
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {lago.tipo && (
            <p className="text-xs text-muted-foreground font-body leading-relaxed">{lago.tipo}</p>
          )}

          {/* Amenazas */}
          {lago.amenazas.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest font-body text-muted-foreground mb-1.5">
                Principales amenazas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {lago.amenazas.map((a) => (
                  <span
                    key={a}
                    className="text-[11px] font-body px-2 py-0.5 rounded-full bg-tierra/10 text-tierra border border-tierra/20"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lago.estado_actual && (
            <p className="text-xs text-muted-foreground font-body leading-relaxed border-t border-border pt-3">
              {lago.estado_actual}
            </p>
          )}

          <Link
            to={`/sitio/${lago.sitio_slug}`}
            className="flex items-center gap-1.5 text-xs font-medium text-selva hover:text-selva-light transition-colors border-t border-border pt-3"
          >
            Ver ficha completa del lago
            <ExternalLink size={11} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
