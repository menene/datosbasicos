import { BookOpen, Code2, Mail } from "lucide-react";

const STACK: Array<{ name: string; slug: string; color: string }> = [
  // Frontend
  { name: "React", slug: "react", color: "61DAFB" },
  { name: "TypeScript", slug: "typescript", color: "3178C6" },
  { name: "Vite", slug: "vite", color: "646CFF" },
  { name: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4" },
  { name: "React Router", slug: "reactrouter", color: "CA4245" },
  { name: "TanStack Query", slug: "reactquery", color: "FF4154" },
  { name: "Framer Motion", slug: "framer", color: "0055FF" },
  { name: "Radix UI", slug: "radixui", color: "161618" },
  { name: "shadcn/ui", slug: "shadcnui", color: "000000" },
  { name: "Lucide", slug: "lucide", color: "F56565" },
  // Backend
  { name: "Python", slug: "python", color: "3776AB" },
  { name: "FastAPI", slug: "fastapi", color: "009688" },
  { name: "SQLAlchemy", slug: "sqlalchemy", color: "D71F00" },
  { name: "Pydantic", slug: "pydantic", color: "E92063" },
  { name: "PostgreSQL", slug: "postgresql", color: "4169E1" },
  // Infrastructure
  { name: "Docker", slug: "docker", color: "2496ED" },
];

const ACERCA_PARRAFOS = [
  'La plataforma digital en línea "Guatemala Datos Básicos 2026" surge como una herramienta estratégica diseñada para proporcionar indicadores demográficos, económicos y sociales actualizados, fundamentados en datos oficiales del Instituto Nacional de Estadística (INE), el Banco de Guatemala y otras fuentes de alta fiabilidad.',
  "En el contexto actual, la transparencia y la disponibilidad de información robusta son fundamentales. Esta plataforma permite a la ciudadanía y a los tomadores de decisiones acceder a datos básicos, confiables y oportunos, ofreciendo evidencia sólida para fundamentar acciones en realidades concretas.",
  "De este modo, se apoya la planificación de estrategias de corto, mediano y largo plazo que respondan con precisión a las necesidades del país.",
  "La información se presenta con un alto nivel de detalle, abarcando la escala departamental y desglosándose para los 340 municipios de la República.",
  "La transparencia en la producción de información es esencial para fortalecer la toma de decisiones informadas; los datos no son solamente cifras numéricas, sirven como base para la toma de decisiones y el diseño de estrategias orientadas al desarrollo nacional.",
  "A través de una interfaz interactiva y amigable, los usuarios pueden visualizar los datos mediante mapas, gráficas y tablas que facilitan la correlación entre distintas variables y la exportación de resultados tanto para consulta web como en formatos compatibles con herramientas de análisis (Excel).",
  "Este esfuerzo es el resultado del trabajo conjunto entre el Ingeniero en Ciencias de la Computación Erick Francisco Marroquín Rodríguez, responsable del desarrollo y programación íntegra del sistema, y el Arquitecto y Demógrafo Omar Marroquín Pacheco.",
  'El proyecto se nutre de la experiencia previa en la elaboración del libro "Guatemala Datos Básicos 1994" y el desarrollo del Calendario Demográfico de Guatemala, experiencias que evidenciaron la necesidad crítica de generar datos que fomenten opinión y criterio profesional.',
  'Los datos de "Guatemala Datos Básicos 1994" —tomados a su vez del Censo de Población del mismo año— constituyen la línea base sobre la cual se realizan las comparaciones de los cambios suscitados en el tiempo.',
  "Concebida como un sistema informático robusto —cuya descripción técnica se detalla en el anexo—, la plataforma ha superado pruebas piloto que demuestran su fiabilidad metodológica.",
  'El reto futuro es la integración continua de nuevas variables, consolidando a "Guatemala Datos Básicos 2026" como una infraestructura nacional de información que promueva el acceso democrático y transparente a datos de calidad.',
  "Más allá de proporcionar datos duros, objetivos y verificables, este proyecto busca motivar la reflexión y la acción. La plataforma no emite interpretaciones, sino que entrega los insumos necesarios para que investigadores, instituciones, gobiernos locales y empresas construyan sus propios modelos y análisis sectoriales.",
  '"Guatemala Datos Básicos 2026" se erige como una "plataforma sombrilla" bajo la cual podrán desarrollarse ecosistemas especializados como Salud, Agua, Educación, Elecciones, Ambiente y Economía, entre otros, todos con el agregado de Datos Básicos.',
  "Esta estructura facilitará un análisis multidimensional de la realidad guatemalteca, fortaleciendo la transparencia y la comprensión integral de los procesos territoriales del país.",
  "Los autores confían en que esta herramienta se convierta en un referente nacional, contribuyendo a fortalecer las capacidades ciudadanas para analizar tendencias y construir mejores perspectivas de futuro para Guatemala.",
];

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

export default function AcercaPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* ── Header ── */}
      <section className="border-b border-border bg-muted/30">
        <div className="max-w-screen-lg mx-auto px-6 py-14">
          <span className="inline-block text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full bg-selva/10 text-selva border border-selva/20 mb-5">
            Sobre este proyecto
          </span>
          <h1 className="font-display font-bold text-foreground text-3xl">
            Acerca de
          </h1>
        </div>
      </section>

      {/* ── Long-form intro ── */}
      <section className="max-w-screen-lg mx-auto px-6 py-14">
        <div className="space-y-5">
          {ACERCA_PARRAFOS.map((parrafo, i) => (
            <p
              key={i}
              className="font-body text-foreground text-[15px] leading-relaxed"
            >
              {parrafo}
            </p>
          ))}
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="max-w-screen-lg mx-auto px-6 pb-14">

        {/* People cards — side by side */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Author of the book */}
          <div className="rounded-2xl border border-border bg-white p-8">
            <div className="flex items-start gap-5">
              <Avatar initials="OM" color="#1B6B3A" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen size={13} className="text-selva shrink-0" />
                  <span className="text-xs text-selva font-body font-medium tracking-wide uppercase">
                    Autor del libro
                  </span>
                </div>
                <h2 className="font-display font-bold text-foreground text-xl mt-1 mb-3">
                  Omar Marroquín Pacheco
                </h2>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
                  Arquitecto con más de 36 años de ejercicio profesional y
                  especialista en Demografía, formado en el Centro
                  Latinoamericano de Demografía (CELADE).
                </p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
                  Profesor universitario por 19 años de Estadística y Demografía
                  en la Universidad del Valle de Guatemala, asesor planificador
                  en la USAC desde 2006, y previamente Jefe de Construcción de
                  la USAC (1995–1998) y Asesor en Medio Ambiente del Parlamento
                  Latinoamericano en Brasil (1991–1994).
                </p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5">
                  Autor de diversos libros especializados en Demografía,
                  ex columnista de los diarios <em>La Hora</em> y{" "}
                  <em>La República</em>, y cofundador del programa radial{" "}
                  <em>Espacios Arquitectónicos</em> en Radio Universidad 92.1 FM
                  (18 años al aire, finalizado en 2022). Actualmente columnista
                  de la revista digital <em>Publicogt</em>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:omar@datosbasicos.gt"
                    className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                  >
                    <Mail size={12} />
                    omar@datosbasicos.gt
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Platform designer */}
          <div className="rounded-2xl border border-border bg-white p-8">
            <div className="flex items-start gap-5">
              <Avatar initials="EM" color="#1E4D8C" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Code2 size={13} className="text-[#1E4D8C] shrink-0" />
                  <span className="text-xs font-body font-medium tracking-wide uppercase" style={{ color: "#1E4D8C" }}>
                    Diseño y desarrollo
                  </span>
                </div>
                <h2 className="font-display font-bold text-foreground text-xl mt-1 mb-3">
                  Erick Francisco Marroquín Rodríguez
                </h2>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
                  Ingeniero en Ciencias de la Computación con 16 años de
                  experiencia en desarrollo de software y 10 años como docente.
                  Catedrático en la Universidad del Valle de Guatemala.
                </p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5">
                  Responsable del diseño, desarrollo y programación íntegra de
                  la plataforma <em>Guatemala Datos Básicos 2026</em>, motivado
                  por continuar el legado de su padre y honrar el libro
                  original <em>Guatemala Datos Básicos 1994</em>, llevando esa
                  visión a una herramienta digital abierta que facilite el
                  acceso a datos, la transparencia y la toma de decisiones
                  informadas para Guatemala.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:erick@datosbasicos.gt"
                    className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                  >
                    <Mail size={12} />
                    erick@datosbasicos.gt
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ── Stack ── */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-screen-lg mx-auto px-6 py-12">
          <h3 className="font-display font-semibold text-foreground text-base mb-1">
            Construido con
          </h3>
          <p className="text-xs text-muted-foreground font-body mb-6">
            Stack open source — frontend, backend, datos e infraestructura.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {STACK.map(({ name, slug, color }) => (
              <div
                key={name}
                className="group flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border bg-white aspect-square hover:shadow-sm hover:border-selva/40 transition-all"
                title={name}
              >
                <img
                  src={`https://cdn.simpleicons.org/${slug}/${color}`}
                  alt={name}
                  width={32}
                  height={32}
                  loading="lazy"
                  className="opacity-90 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-[10px] font-body font-medium text-muted-foreground text-center leading-tight">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
