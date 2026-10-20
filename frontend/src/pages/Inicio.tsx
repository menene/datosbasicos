import { useNavigate } from "react-router-dom";
import {
  Map,
  BarChart2,
  Table2,
  FileText,
  ArrowRight,
  Compass,
  GitCompareArrows,
  FolderOpen,
  ScatterChart,
  TrendingUp,
  BarChartHorizontal,
  Filter,
  Link2,
  Download,
} from "lucide-react";
import { track } from "@/lib/analytics";
import BloqueContacto from "@/components/BloqueContacto";

const SECTIONS = [
  {
    to: "/mapa",
    icon: Map,
    label: "Mapa",
    color: "#1B6B3A",
    bg: "#D6ECD8",
    desc: "Mapa interactivo de los 22 departamentos. Explora cualquier indicador en el territorio.",
  },
  {
    to: "/explorador",
    icon: Compass,
    label: "Explorador",
    color: "#1B6B3A",
    bg: "#E8C54733",
    desc: "Arma tu propia gráfica: ranking, dispersión o evolución, con filtros por región, departamento y vulnerabilidad.",
  },
  {
    to: "/graficas",
    icon: BarChart2,
    label: "Gráficas",
    color: "#1E4D8C",
    bg: "#DBEAFE",
    desc: "Rankings y correlaciones entre variables. Compara departamentos visualmente.",
  },
  {
    to: "/tabla",
    icon: Table2,
    label: "Tabla",
    color: "#6B3A1B",
    bg: "#FEE9D0",
    desc: "Todos los indicadores en una tabla ordenable y filtrable. Ideal para análisis rápido y exportable a Excel",
  },
  {
    to: "/ficha",
    icon: FileText,
    label: "Fichas",
    color: "#5B21B6",
    bg: "#EDE9FE",
    desc: "Perfil completo de cada departamento: indicadores, gráficas y datos históricos.",
  },
  {
    to: "/tabla",
    icon: GitCompareArrows,
    label: "Comparativo entre años",
    color: "#8B4513",
    bg: "#FDF1D8",
    desc: "Compara los indicadores entre 1994, 2005 y 2025 lado a lado en tabla, gráficas y fichas. Selecciona los años desde cada sección.",
  },
  {
    to: "/anexos",
    icon: FolderOpen,
    label: "Anexos",
    color: "#0F766E",
    bg: "#CCFBF1",
    desc: "Estudios hidrosociales por vertiente, infografías, noticias y documentos de referencia, para ver o descargar.",
  },
//   {
//     to: "/libro",
//     icon: BookMarked,
//     label: "Libro",
//     color: "#854D0E",
//     bg: "#FEF9C3",
//     desc: "Descarga el atlas estadístico en PDF. Referencia completa para investigadores y tomadores de decisiones.",
//   },
];

// Gráficas ya armadas en el Explorador: el estado vive en la URL, así que cada
// ejemplo es solo un enlace.
const EJEMPLOS_EXPLORADOR = [
  {
    to: "/explorador?nivel=municipios&v=vulnerabilidad_social&color=categoria",
    icon: BarChartHorizontal,
    tipo: "Ranking",
    titulo: "Los 20 municipios más vulnerables",
  },
  {
    to: "/explorador?tipo=dispersion&v=analfabetismo_pct&x=pct_indigena&color=region&res=noroccidente",
    icon: ScatterChart,
    tipo: "Dispersión",
    titulo: "Analfabetismo frente a población indígena",
  },
  {
    to: "/explorador?tipo=evolucion&v=analfabetismo_pct&color=region&res=norte",
    icon: TrendingUp,
    tipo: "Evolución",
    titulo: "Cómo bajó el analfabetismo, 2005–2025",
  },
  {
    to: "/explorador?nivel=municipios&tipo=dispersion&v=vulnerabilidad_social&x=acceso_agua_pct&color=categoria",
    icon: ScatterChart,
    tipo: "Dispersión · municipios",
    titulo: "Vulnerabilidad frente a acceso a agua",
  },
];

const CAPACIDADES_EXPLORADOR = [
  { icon: BarChartHorizontal, texto: "Ranking, dispersión o evolución en el tiempo" },
  { icon: Filter, texto: "Filtros por región, departamento, vulnerabilidad y rango de valores" },
  { icon: Link2, texto: "Cada gráfica queda en un enlace para compartirla" },
  { icon: Download, texto: "Descarga los datos de la vista en CSV" },
];

const HIGHLIGHTS = [
  { value: "22", label: "Departamentos" },
  { value: "340", label: "Municipios" },
  { value: "15", label: "Indicadores" },
  { value: "2026", label: "Edición" },
];

export default function InicioPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, #1B6B3A 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
        {/* Green accent blob */}
        <div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #1B6B3A, transparent 70%)" }}
        />

        <div className="relative max-w-screen-xl mx-auto px-6 pt-20 pb-16">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full bg-selva/10 text-selva border border-selva/20 mb-6">
              Atlas estadístico · Guatemala
            </span>

            <h1 className="font-display font-bold text-foreground leading-tight mb-5"
              style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)" }}>
              Guatemala<br />
              <span className="text-selva">Datos Básicos</span>{" "}
              <span className="text-maiz">2026</span>
            </h1>

            <p className="text-muted-foreground font-body text-lg leading-relaxed mb-6 max-w-xl">
              Plataforma de datos abiertos con indicadores demográficos, sociales y
              económicos de los 22 departamentos de Guatemala. Visualiza, compara
              y descarga la información.
            </p>

            <button
              onClick={() => {
                track("inicio_cta", { destino: "/explorador", origen: "hero_nuevo" });
                navigate("/explorador");
              }}
              className="group inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-maiz/10 border border-maiz/30 mb-8 text-left hover:bg-maiz/20 transition-colors"
            >
              <Compass size={15} className="text-tierra shrink-0" />
              <span className="text-sm font-body text-foreground">
                <span className="font-semibold">Nuevo:</span> el Explorador. Arma tus
                propias gráficas con cualquier indicador, filtra por región o
                vulnerabilidad y comparte el enlace.
              </span>
              <ArrowRight
                size={14}
                className="text-tierra shrink-0 group-hover:translate-x-0.5 transition-transform"
              />
            </button>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  track("inicio_cta", { destino: "/mapa", origen: "hero" });
                  navigate("/mapa");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-selva text-white font-body font-medium text-sm hover:bg-selva/90 transition-colors"
              >
                Explorar el mapa
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => {
                  track("inicio_cta", { destino: "/explorador", origen: "hero" });
                  navigate("/explorador");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-selva/40 bg-white text-selva font-body font-medium text-sm hover:bg-selva/5 transition-colors"
              >
                <Compass size={15} />
                Arma tu gráfica
              </button>
              {/* <button
                onClick={() => navigate("/libro")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-body font-medium text-sm hover:bg-muted transition-colors"
              >
                <BookMarked size={15} />
                Descargar libro PDF
              </button> */}
            </div>
          </div>

          {/* Highlight stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 mt-14 pt-12 border-t border-border">
            {HIGHLIGHTS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="font-display font-bold text-foreground leading-none tabular-nums"
                  style={{ fontSize: "clamp(2.75rem, 6vw, 4.5rem)" }}
                >
                  {value}
                </p>
                <p className="text-muted-foreground font-body text-sm md:text-base uppercase tracking-widest mt-3">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explorador destacado ── */}
      <section className="border-b border-border bg-selva text-white">
        <div className="max-w-screen-xl mx-auto px-6 py-16 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-5">
              <Compass size={12} />
              Nuevo · Explorador
            </span>
            <h2 className="font-display font-bold text-3xl leading-tight mb-4">
              Haz tus propias preguntas a los datos
            </h2>
            <p className="font-body text-white/80 leading-relaxed mb-6 max-w-lg">
              Elige departamentos o municipios, cualquier indicador y el tipo de gráfica.
              La gráfica cambia al instante con cada filtro.
            </p>
            <ul className="space-y-2.5 mb-8">
              {CAPACIDADES_EXPLORADOR.map(({ icon: Icon, texto }) => (
                <li key={texto} className="flex items-start gap-2.5 text-sm font-body text-white/90">
                  <Icon size={16} className="text-maiz shrink-0 mt-0.5" />
                  {texto}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                track("inicio_cta", { destino: "/explorador", origen: "explorador_destacado" });
                navigate("/explorador");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-maiz text-foreground font-body font-semibold text-sm hover:bg-maiz/90 transition-colors"
            >
              Abrir el Explorador
              <ArrowRight size={15} />
            </button>
          </div>

          <div>
            <p className="text-xs font-body uppercase tracking-widest text-white/60 mb-3">
              Empieza con un ejemplo
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {EJEMPLOS_EXPLORADOR.map(({ to, icon: Icon, tipo, titulo }) => (
                <button
                  key={to}
                  onClick={() => {
                    track("inicio_cta", { destino: to, origen: "explorador_ejemplo" });
                    navigate(to);
                  }}
                  className="group text-left rounded-xl bg-white/[0.07] border border-white/15 p-4 hover:bg-white/[0.12] hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Icon size={16} className="text-maiz" />
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                  <p className="text-[11px] font-body uppercase tracking-wide text-white/60 mb-0.5">
                    {tipo}
                  </p>
                  <p className="font-display font-semibold text-white leading-snug">{titulo}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sections grid ── */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <h2 className="font-display font-semibold text-foreground text-xl mb-2">
          Herramientas disponibles
        </h2>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Muchas formas de explorar los datos de Guatemala.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ to, icon: Icon, label, color, bg, desc }) => (
            <button
              key={label}
              onClick={() => {
                track("inicio_cta", { destino: to, origen: "herramientas" });
                navigate(to);
              }}
              className="group flex flex-col justify-start text-left rounded-2xl border border-border bg-white p-6 hover:border-transparent hover:shadow-lg transition-all duration-200"
              style={{ "--hover-color": color } as React.CSSProperties}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>

              <div className="w-full flex items-center justify-between mb-2">
                <h3
                  className="font-display font-semibold text-foreground text-base group-hover:transition-colors"
                  style={{ color: undefined }}
                >
                  {label}
                </h3>
                <ArrowRight
                  size={15}
                  className="text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200"
                />
              </div>

              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* ── Contacto ── */}
      <section className="border-t border-border bg-muted/30">
        <BloqueContacto className="max-w-screen-xl mx-auto px-6 py-16" />
      </section>
    </div>
  );
}
