/** Pie de página común a todas las páginas (lo monta AppShell en App.tsx). */
export default function PiePagina() {
  return (
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
  );
}
