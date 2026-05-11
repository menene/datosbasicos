import { Download, BookOpen, MapPin, BarChart2, Users, Droplets } from "lucide-react";

const CHAPTERS = [
  { num: "01", title: "Panorama demográfico", desc: "Población, densidad, estructura por edad y distribución territorial de los 22 departamentos." },
  { num: "02", title: "Territorio y geografía", desc: "Superficie, regiones administrativas, características físicas y uso del suelo." },
  { num: "03", title: "Composición étnica y cultural", desc: "Pueblos indígenas, idiomas mayas, distribución territorial y diversidad cultural." },
  { num: "04", title: "Salud y esperanza de vida", desc: "Indicadores de salud, mortalidad, fecundidad y acceso a servicios." },
  { num: "05", title: "Educación y alfabetismo", desc: "Tasas de analfabetismo, cobertura escolar y brechas educativas por región." },
  { num: "06", title: "Acceso a servicios básicos", desc: "Agua potable, saneamiento, energía eléctrica y conectividad por departamento." },
];

const STATS = [
  { icon: MapPin, value: "22", label: "Departamentos" },
  { icon: BarChart2, value: "130+", label: "Indicadores" },
  { icon: Users, value: "18M", label: "Personas" },
  { icon: Droplets, value: "2026", label: "Edición" },
];

// 3-D book mockup — pure CSS
function BookCover() {
  return (
    <div className="relative select-none" style={{ perspective: 1200 }}>
      <div
        className="relative"
        style={{
          width: 240,
          height: 320,
          transformStyle: "preserve-3d",
          transform: "rotateY(-22deg) rotateX(4deg)",
          filter: "drop-shadow(-24px 32px 40px rgba(0,0,0,0.55))",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-r-md overflow-hidden flex flex-col"
          style={{
            background: "linear-gradient(160deg, #1B6B3A 0%, #0d3d20 60%, #071f10 100%)",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Spine shadow */}
          <div
            className="absolute left-0 top-0 bottom-0 w-5"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,0.35), transparent)" }}
          />

          {/* Texture lines */}
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full"
              style={{
                top: `${(i / 18) * 100}%`,
                height: 1,
                background: "rgba(255,255,255,0.04)",
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 flex flex-col h-full px-6 pt-8 pb-6">
            {/* Badge */}
            <span
              className="self-start text-[9px] font-body tracking-widest uppercase px-2 py-0.5 rounded-full mb-6"
              style={{ background: "rgba(232,197,71,0.25)", color: "#E8C547", border: "1px solid rgba(232,197,71,0.4)" }}
            >
              Edición 2026
            </span>

            {/* Guatemala outline — simplified SVG */}
            <div className="flex-1 flex items-center justify-center">
              <svg viewBox="0 0 100 80" width={110} height={88} opacity={0.18}>
                <path
                  d="M20 10 L80 8 L82 20 L90 22 L88 35 L78 40 L80 55 L70 62 L60 58 L50 65 L40 60 L30 65 L18 55 L15 42 L10 30 Z"
                  fill="white"
                />
              </svg>
            </div>

            {/* Title */}
            <div>
              <p className="text-[10px] font-body tracking-widest uppercase text-white/40 mb-1">
                Guatemala
              </p>
              <h3 className="font-display font-bold leading-tight text-white" style={{ fontSize: 22 }}>
                Datos<br />Básicos
              </h3>
              <div className="mt-3 w-8 h-0.5" style={{ background: "#E8C547" }} />
              <p className="mt-3 text-[9px] font-body text-white/40 tracking-wider uppercase">
                Atlas departamental
              </p>
            </div>
          </div>
        </div>

        {/* Spine */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            width: 28,
            left: -28,
            background: "linear-gradient(to right, #0a2e18, #1B6B3A)",
            transform: "rotateY(-90deg)",
            transformOrigin: "right center",
          }}
        >
          <div className="h-full flex items-center justify-center">
            <span
              className="font-display font-bold text-white/70 whitespace-nowrap"
              style={{ fontSize: 9, letterSpacing: 2, writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              GUATEMALA · DATOS BÁSICOS 2026
            </span>
          </div>
        </div>

        {/* Back face (barely visible) */}
        <div
          className="absolute inset-0 rounded-r-md"
          style={{
            background: "#061a0c",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        />
      </div>

      {/* Shadow on surface */}
      <div
        className="absolute -bottom-6 left-4 right-0 h-8 rounded-full blur-2xl opacity-60"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
    </div>
  );
}

export default function LibroPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #071f10 0%, #0f3520 40%, #1B6B3A 100%)" }}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-screen-xl mx-auto px-6 py-24 flex flex-col md:flex-row items-center gap-16">
          {/* Text */}
          <div className="flex-1 text-white">
            <span className="inline-block text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full mb-6"
              style={{ background: "rgba(232,197,71,0.15)", color: "#E8C547", border: "1px solid rgba(232,197,71,0.3)" }}
            >
              Descarga gratuita · PDF
            </span>

            <h1 className="font-display font-bold leading-tight mb-4" style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}>
              Guatemala<br />
              <span style={{ color: "#E8C547" }}>Datos Básicos</span><br />
              2026
            </h1>

            <p className="text-white/65 font-body text-base leading-relaxed max-w-md mb-8">
              Un atlas estadístico completo de los 22 departamentos de Guatemala.
              Indicadores demográficos, sociales y económicos reunidos en un solo documento de referencia.
            </p>

            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg font-body font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-100"
              style={{ background: "#E8C547", color: "#071f10" }}
            >
              <Download size={16} />
              Descargar PDF
            </button>
          </div>

          {/* Book */}
          <div className="flex-shrink-0 flex items-center justify-center py-8 md:py-0">
            <BookCover />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.25)" }}>
          <div className="max-w-screen-xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(232,197,71,0.15)" }}>
                  <Icon size={15} style={{ color: "#E8C547" }} />
                </div>
                <div>
                  <p className="font-display font-bold text-white text-lg leading-none">{value}</p>
                  <p className="text-white/50 font-body text-xs mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contenido ─────────────────────────────────────────────────── */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-10">
          <BookOpen size={20} className="text-selva" />
          <h2 className="font-display font-semibold text-xl text-foreground">
            Contenido del libro
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAPTERS.map((ch) => (
            <div
              key={ch.num}
              className="group rounded-xl border border-border p-5 hover:border-selva/40 hover:shadow-sm transition-all duration-200 bg-white"
            >
              <span className="font-display font-bold text-3xl"
                style={{ color: "rgba(27,107,58,0.15)", lineHeight: 1 }}>
                {ch.num}
              </span>
              <h3 className="font-display font-semibold text-foreground text-sm mt-2 mb-1.5 group-hover:text-selva transition-colors">
                {ch.title}
              </h3>
              <p className="text-xs text-muted-foreground font-body leading-relaxed">
                {ch.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA final ─────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="max-w-screen-xl mx-auto px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Listo para descargar
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-1">
              PDF · Acceso abierto · Sin registro requerido
            </p>
          </div>
          <button
            onClick={() => {}}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg font-body font-medium text-sm bg-selva text-white hover:bg-selva/90 transition-all duration-200 hover:scale-105 active:scale-100 whitespace-nowrap"
          >
            <Download size={16} />
            Descargar PDF
          </button>
        </div>
      </section>
    </div>
  );
}
