import { useNavigate } from "react-router-dom";
import { Map, BarChart2, Table2, FileText, BookMarked, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    to: "/mapa",
    icon: Map,
    label: "Mapa",
    color: "#1B6B3A",
    bg: "#D6ECD8",
    desc: "Choropleth interactivo de los 22 departamentos. Explora cualquier indicador en el territorio.",
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
    desc: "Todos los indicadores en una tabla ordenable y filtrable. Ideal para análisis rápido.",
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
    to: "/libro",
    icon: BookMarked,
    label: "Libro",
    color: "#854D0E",
    bg: "#FEF9C3",
    desc: "Descarga el atlas estadístico en PDF. Referencia completa para investigadores y tomadores de decisiones.",
  },
];

const HIGHLIGHTS = [
  { value: "22", label: "Departamentos" },
  { value: "13", label: "Indicadores" },
  { value: "18 M", label: "Habitantes" },
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

            <p className="text-muted-foreground font-body text-lg leading-relaxed mb-8 max-w-xl">
              Plataforma de datos abiertos con indicadores demográficos, sociales y
              económicos de los 22 departamentos de Guatemala. Visualiza, compara
              y descarga la información.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/mapa")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-selva text-white font-body font-medium text-sm hover:bg-selva/90 transition-colors"
              >
                Explorar el mapa
                <ArrowRight size={15} />
              </button>
              <button
                onClick={() => navigate("/libro")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground font-body font-medium text-sm hover:bg-muted transition-colors"
              >
                <BookMarked size={15} />
                Descargar libro PDF
              </button>
            </div>
          </div>

          {/* Highlight stats */}
          <div className="flex flex-wrap gap-8 mt-14 pt-10 border-t border-border">
            {HIGHLIGHTS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-display font-bold text-foreground text-3xl leading-none">{value}</p>
                <p className="text-muted-foreground font-body text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sections grid ── */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <h2 className="font-display font-semibold text-foreground text-xl mb-2">
          Herramientas disponibles
        </h2>
        <p className="text-sm text-muted-foreground font-body mb-8">
          Cinco formas de explorar los datos de Guatemala.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ to, icon: Icon, label, color, bg, desc }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group text-left rounded-2xl border border-border bg-white p-6 hover:border-transparent hover:shadow-lg transition-all duration-200"
              style={{ "--hover-color": color } as React.CSSProperties}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>

              <div className="flex items-center justify-between mb-2">
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

      {/* ── Footer note ── */}
      <footer className="border-t border-border">
        <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-body">
            Datos con fines educativos e informativos. Fuentes: INE, MSPAS, MINEDUC · Guatemala {new Date().getFullYear()}.
          </p>
          <span className="font-display font-semibold text-selva text-sm tracking-tight">
            Guatemala <span className="text-maiz">·</span> Datos Básicos 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
