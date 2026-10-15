import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, FolderOpen, Map, Table2 } from "lucide-react";

const ATAJOS = [
  { to: "/mapa", label: "Mapa", descripcion: "Departamentos y municipios en el mapa", icon: Map },
  { to: "/tabla", label: "Tabla", descripcion: "Todos los indicadores, para filtrar y descargar", icon: Table2 },
  { to: "/anexos", label: "Anexos", descripcion: "Estudios, infografías y documentos", icon: FolderOpen },
];

/** Cualquier ruta que no exista (App.tsx la monta en path="*"). */
export default function NoEncontradoPage() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <section className="max-w-screen-md mx-auto px-6 py-20">
        {/* Brújula que busca el rumbo: la esfera queda fija y la aguja oscila como si
            no encontrara el norte (animación `brujula` de tailwind.config.ts). */}
        <svg viewBox="0 0 100 100" className="w-24 h-24 mb-6" aria-hidden>
          <circle cx="50" cy="50" r="46" className="fill-white stroke-tierra/30" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="50" cy="50" r="38" className="fill-tierra/10" />
          {[0, 90, 180, 270].map((a) => (
            <line
              key={a}
              x1="50" y1="15" x2="50" y2="21"
              transform={`rotate(${a} 50 50)`}
              className="stroke-tierra/50" strokeWidth="2" strokeLinecap="round"
            />
          ))}
          <text x="50" y="31" textAnchor="middle" className="fill-tierra font-display font-semibold" fontSize="9">N</text>
          {/* motion-safe: quieta para quien pidió reducir el movimiento */}
          <g className="motion-safe:animate-brujula" style={{ transformOrigin: "50px 50px" }}>
            <polygon points="50,22 56,50 44,50" fill="#C0392B" />
            <polygon points="50,78 56,50 44,50" className="fill-foreground/70" />
          </g>
          <circle cx="50" cy="50" r="3.5" className="fill-white stroke-foreground/60" strokeWidth="1.5" />
        </svg>
        <h1 className="font-display font-bold text-foreground text-3xl mb-3">
          Página no encontrada
        </h1>
        <p className="font-body text-muted-foreground text-[15px] leading-relaxed max-w-xl">
          La dirección{" "}
          <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-sm break-all">
            {pathname}
          </code>{" "}
          no existe en Guatemala Datos Básicos. Puede que el enlace esté mal escrito o que la
          página se haya movido.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mt-8 text-sm font-body font-medium rounded-md px-4 py-2 bg-selva text-white hover:bg-selva-light transition-colors"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>

        <ul className="grid gap-3 sm:grid-cols-3 mt-12">
          {ATAJOS.map(({ to, label, descripcion, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex h-full flex-col gap-2 rounded-xl border border-border bg-white p-4 hover:border-selva/40 hover:shadow-sm transition-all"
              >
                <Icon size={18} className="text-selva" />
                <span className="font-display font-semibold text-foreground text-sm">{label}</span>
                <span className="text-xs text-muted-foreground font-body leading-relaxed">
                  {descripcion}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
