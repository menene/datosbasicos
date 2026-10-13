// Anexos: estudios y planes hidrosociales publicados como PDF en
// /archivos/anexos/<slug>.pdf (frontend/public/archivos/anexos). Los genera
// scripts/build_anexos.py a partir de los Word de docs/agua; esta lista debe
// coincidir con la del script (slugs y títulos).

export interface Anexo {
  numero: number;
  slug: string;
  titulo: string;
  descripcion: string;
  vertiente: "Pacífico" | "Caribe" | "Golfo de México";
  paginas: number;
  /** Tamaño del PDF en KB. */
  kb: number;
}

export const ANEXOS: Anexo[] = [
  {
    numero: 1,
    slug: "vertiente-pacifico",
    titulo: "Estudio hidrosocial de la Vertiente del Pacífico",
    descripcion:
      "Las 18 cuencas de la vertiente: población, agua y saneamiento, cargas contaminantes por cuenca, metales pesados y análisis de gobernanza con hoja de ruta 2026–2030.",
    vertiente: "Pacífico",
    paginas: 16,
    kb: 697,
  },
  {
    numero: 2,
    slug: "cuenca-maria-linda",
    titulo: "Estudio hidrosocial de la cuenca del río María Linda",
    descripcion:
      "Caracterización física, dinámica hidrosocial, conflictos, marco institucional y plan de gestión de la cuenca que nace en el Lago de Amatitlán.",
    vertiente: "Pacífico",
    paginas: 9,
    kb: 246,
  },
  {
    numero: 3,
    slug: "vertiente-caribe",
    titulo: "Estudio hidrosocial de las cuencas de la Vertiente del Caribe",
    descripcion:
      "Motagua, Polochic, Cahabón, Sarstún y Río Dulce: población, acceso a agua y saneamiento, gobernanza y estimación de la carga contaminante.",
    vertiente: "Caribe",
    paginas: 12,
    kb: 354,
  },
  {
    numero: 4,
    slug: "cuenca-cahabon-polochic",
    titulo: "Estudio hidrosocial de la cuenca Cahabón-Polochic",
    descripcion:
      "El sistema que desemboca en el Lago de Izabal: hidrología, dimensión social y cultural q'eqchi', conflictos y propuestas de gestión.",
    vertiente: "Caribe",
    paginas: 5,
    kb: 146,
  },
  {
    numero: 5,
    slug: "vertiente-golfo-de-mexico",
    titulo: "Estudio hidrosocial de la Vertiente del Golfo de México",
    descripcion:
      "Fichas hidrosociales de las ocho cuencas de la vertiente —Usumacinta, La Pasión, Salinas, San Pedro, Candelaria, Chixoy, Ixcán y Xaclbal— y análisis integrado.",
    vertiente: "Golfo de México",
    paginas: 7,
    kb: 208,
  },
  {
    numero: 6,
    slug: "cuenca-usumacinta",
    titulo: "Estudio hidrosocial de la cuenca del río Usumacinta",
    descripcion:
      "La porción guatemalteca de la cuenca más caudalosa de Centroamérica: zonificación, régimen hidrológico, población, conflictos y gestión transfronteriza.",
    vertiente: "Golfo de México",
    paginas: 8,
    kb: 261,
  },
  {
    numero: 7,
    slug: "plan-gestion-usumacinta",
    titulo: "Plan de gestión integrada de la cuenca del río Usumacinta",
    descripcion:
      "Visión 2040, objetivos estratégicos, línea de base y metas e indicadores por componente para la porción guatemalteca de la cuenca.",
    vertiente: "Golfo de México",
    paginas: 5,
    kb: 187,
  },
];

/**
 * Documentos de otros autores que la plataforma ofrece para descargar. No son
 * anexos del libro: van en su propia sección y sin número. Viven en
 * frontend/public/archivos/referencias.
 */
export interface DocumentoReferencia {
  slug: string;
  titulo: string;
  autores: string;
  descripcion: string;
  url: string;
  paginas: number;
  /** Tamaño del PDF en MB. */
  mb: number;
}

export const DOCUMENTOS_REFERENCIA: DocumentoReferencia[] = [
  {
    slug: "perfil-ambiental-de-guatemala-2023",
    titulo: "Perfil Ambiental de Guatemala 2023",
    autores: "Jaime Luis Carrera y Virginia Mosquera · septiembre de 2023",
    descripcion: "Volumen «Agua» de la Serie Perfil Ambiental de Guatemala.",
    url: "/archivos/referencias/perfil-ambiental-de-guatemala-2023.pdf",
    paginas: 74,
    mb: 3.8,
  },
];
