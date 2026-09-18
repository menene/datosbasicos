import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

/** Compact breadcrumb trail for the fichas (Fichas › Departamento › Municipio). */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="flex items-center flex-wrap gap-1 text-sm font-body">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {item.to && !last ? (
              <Link to={item.to} className="text-muted-foreground hover:text-selva transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-foreground font-medium" : "text-muted-foreground"}>
                {item.label}
              </span>
            )}
            {!last && <ChevronRight size={13} className="text-muted-foreground/60 shrink-0" />}
          </span>
        );
      })}
    </nav>
  );
}
