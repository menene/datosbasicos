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

/**
 * Sitios externos de consulta. No son archivos: se abren en otra pestaña, sin
 * descarga ni tamaño.
 */
export interface RecursoEnLinea {
  slug: string;
  titulo: string;
  institucion: string;
  descripcion: string;
  url: string;
}

export const RECURSOS_EN_LINEA: RecursoEnLinea[] = [
  {
    slug: "coleccion-biblioteca-landivar",
    titulo: "Colección en la biblioteca de la Universidad Rafael Landívar",
    institucion: "CRAI · Universidad Rafael Landívar",
    descripcion: "Colección digital del catálogo de la biblioteca de la Universidad Rafael Landívar.",
    url: "https://crailandivarlibrary.primo.exlibrisgroup.com/discovery/collectionDiscovery?vid=502URL_INST:502URL&collectionId=8173007860007696&lang=es",
  },
  {
    slug: "documento-biblioteca-landivar",
    titulo: "Documento en la biblioteca de la Universidad Rafael Landívar",
    institucion: "CRAI · Universidad Rafael Landívar",
    descripcion: "Documento digital disponible para consulta en línea en la biblioteca de la Universidad Rafael Landívar.",
    url: "https://crailandivarlibrary.primo.exlibrisgroup.com/discovery/delivery/502URL_INST:502URL/12142568390007696",
  },
  {
    slug: "infoiarna",
    titulo: "InfoIarna",
    institucion: "Iarna · Universidad Rafael Landívar",
    descripcion:
      "Publicaciones del Iarna sobre el ambiente de Guatemala: el Perfil Ambiental, las cuentas ambientales, información de ecosistemas y la revista Clavius.",
    url: "https://infoiarna.url.edu.gt/",
  },
];

/**
 * Infografías propias de la plataforma, como imagen o PDF, en
 * frontend/public/archivos/infografias. Los PDF llevan una miniatura de su primera
 * página (pdftoppm -jpeg -r 50 -f 1 -l 1 -singlefile).
 */
export interface Infografia {
  slug: string;
  titulo: string;
  autor?: string;
  descripcion: string;
  url: string;
  /** Imagen de la tarjeta; si falta, la propia imagen de `url`. */
  miniatura?: string;
  formato: "JPG" | "PDF";
  /** "768 × 1376 px" para una imagen, "2 páginas" para un PDF. */
  detalle: string;
  /** Tamaño del archivo en KB. */
  kb: number;
}

export const INFOGRAFIAS: Infografia[] = [
  {
    slug: "estadisticas-geograficas-departamentos",
    titulo: "Estadísticas geográficas de los departamentos de Guatemala",
    descripcion:
      "Los 22 departamentos en una tabla: cabecera, región, área, municipios, aldeas, distancia a la capital, ríos y sitios arqueológicos.",
    url: "/archivos/infografias/estadisticas-geograficas-departamentos.jpg",
    formato: "JPG",
    detalle: "768 × 1376 px",
    kb: 264,
  },
  {
    slug: "proyecciones-demograficas-departamentos",
    titulo: "Proyecciones demográficas por departamento, 2024–2050",
    autor: "Omar Marroquín Pacheco",
    descripcion:
      "Población de los 22 departamentos proyectada a 2030, 2040 y 2050 a partir de su tiempo de duplicación, con los principales hallazgos e implicaciones para la planificación.",
    url: "/archivos/infografias/proyecciones-demograficas-departamentos.pdf",
    miniatura: "/archivos/infografias/proyecciones-demograficas-departamentos-miniatura.jpg",
    formato: "PDF",
    detalle: "2 páginas",
    kb: 30,
  },
];

/**
 * Noticias de prensa sobre temas de la plataforma: enlace a la nota en línea y la
 * versión impresa escaneada, en frontend/public/archivos/noticias.
 */
export interface Noticia {
  slug: string;
  /** Titular de portada. */
  titulo: string;
  bajada: string;
  medio: string;
  /** Fecha de publicación, AAAA-MM-DD. */
  fecha: string;
  autor: string;
  /** Título de la nota en las páginas interiores. */
  tituloInterior: string;
  url: string;
  paginas: Array<{ etiqueta: string; url: string }>;
}

export const NOTICIAS: Noticia[] = [
  {
    slug: "kubul-idioma-maya-23",
    titulo: "Luchan por ser el idioma maya número 23",
    bajada:
      "Habitantes y autoridades de Cubulco, Baja Verapaz, han solicitado hacer oficial su lengua nativa, el k'ub'ul, que la ALMG considera una variante del achi'.",
    medio: "Prensa Libre",
    fecha: "2026-08-30",
    autor: "Raúl Barreno Castillo",
    tituloInterior: "K'ub'ul, el idioma que persigue su propio espacio",
    url: "https://www.prensalibre.com/guatemala/comunitario/kubul-que-hay-detras-de-la-busqueda-por-convertirse-en-el-idioma-maya-numero-23/",
    paginas: [
      { etiqueta: "Págs. 8–9", url: "/archivos/noticias/kubul-idioma-maya-23-pags-8-9.jpg" },
      { etiqueta: "Pág. 10", url: "/archivos/noticias/kubul-idioma-maya-23-pag-10.jpg" },
    ],
  },
];
