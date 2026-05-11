import { BookOpen, Code2, Mail, Globe } from "lucide-react";

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
        <div className="max-w-screen-md mx-auto px-6 py-14">
          <span className="inline-block text-xs font-body tracking-widest uppercase px-3 py-1 rounded-full bg-selva/10 text-selva border border-selva/20 mb-5">
            Sobre este proyecto
          </span>
          <h1 className="font-display font-bold text-foreground text-3xl mb-3">
            Acerca de
          </h1>
          <p className="text-muted-foreground font-body text-base leading-relaxed max-w-xl">
            <em>Guatemala Datos Básicos 2026</em> es un libro de referencia estadística
            y una plataforma digital de datos abiertos sobre los 22 departamentos del país.
            Dos personas hicieron esto posible.
          </p>
        </div>
      </section>

      {/* ── Cards ── */}
      <section className="max-w-screen-md mx-auto px-6 py-14 space-y-6">

        {/* Author of the book */}
        <div className="rounded-2xl border border-border bg-white p-8">
          <div className="flex items-start gap-6">
            <Avatar initials="AA" color="#1B6B3A" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <BookOpen size={13} className="text-selva shrink-0" />
                <span className="text-xs text-selva font-body font-medium tracking-wide uppercase">
                  Autor del libro
                </span>
              </div>
              <h2 className="font-display font-bold text-foreground text-xl mt-1 mb-3">
                [Nombre del autor]
              </h2>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5">
                [Descripción del autor — formación académica, trayectoria, institución,
                motivación para escribir el libro, etc.]
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                >
                  <Mail size={12} />
                  correo@ejemplo.com
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                >
                  <Globe size={12} />
                  sitio web
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Platform designer */}
        <div className="rounded-2xl border border-border bg-white p-8">
          <div className="flex items-start gap-6">
            <Avatar initials="DI" color="#1E4D8C" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Code2 size={13} className="text-[#1E4D8C] shrink-0" />
                <span className="text-xs font-body font-medium tracking-wide uppercase" style={{ color: "#1E4D8C" }}>
                  Diseño y desarrollo de la plataforma
                </span>
              </div>
              <h2 className="font-display font-bold text-foreground text-xl mt-1 mb-3">
                [Tu nombre]
              </h2>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5">
                [Tu descripción — quién eres, qué haces, por qué construiste esta herramienta,
                tecnologías utilizadas, etc.]
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                >
                  <Mail size={12} />
                  correo@ejemplo.com
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs font-body text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5"
                >
                  <Globe size={12} />
                  sitio web
                </a>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── Stack note ── */}
      <section className="border-t border-border">
        <div className="max-w-screen-md mx-auto px-6 py-10">
          <h3 className="font-display font-semibold text-foreground text-sm mb-3">
            Construido con
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              "React 18", "TypeScript", "Vite", "Tailwind CSS",
              "FastAPI", "PostgreSQL", "Recharts", "TanStack Table",
              "D3.js", "Docker",
            ].map((tech) => (
              <span
                key={tech}
                className="text-xs font-body px-2.5 py-1 rounded-full border border-border text-muted-foreground bg-muted/40"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
