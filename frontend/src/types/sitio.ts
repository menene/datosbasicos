// Sitios de interés: lugares con ficha propia (lagos, sitios arqueológicos,
// parques naturales). La ficha del departamento solo los lista; el informe
// completo vive en /sitio/:slug para no robarle el foco a los indicadores.

/** Bloque genérico para un sitio que no tiene un dataset especializado detrás. */
export interface SeccionSitio {
  titulo: string;
  parrafos: string[];
  items: string[];
}

export interface Sitio {
  slug: string;
  nombre: string;
  /** Etiqueta visible: "Lago", "Sitio arqueológico", "Parque natural"… */
  tipo: string;
  departamento_slug: string;
  departamento: string;
  /** Municipios donde está, en texto libre. */
  ubicacion: string | null;
  resumen: string;
  dato_clave_label: string | null;
  dato_clave: string | null;
  /** Dónde vive el detalle: "lago" → /api/v1/lagos/{detalle_slug}; null → `secciones`. */
  detalle: "lago" | null;
  detalle_slug: string | null;
  secciones: SeccionSitio[];
}
