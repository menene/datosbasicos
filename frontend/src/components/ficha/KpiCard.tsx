interface Props {
  label: string;
  unit?: string;
  /** One entry per year. A single entry hides the year label (single-snapshot ficha). */
  valores: Array<{ anio: number; texto: string }>;
}

export default function KpiCard({ label, unit, valores }: Props) {
  const multi = valores.length > 1;
  return (
    <div className="rounded-lg px-4 py-3 border bg-muted/40 border-border">
      <p className="text-xs text-muted-foreground font-body mb-1.5">{label}</p>
      <div className={multi ? "space-y-0.5" : ""}>
        {valores.map(({ anio, texto }) => (
          <div key={anio} className="flex items-baseline gap-1.5 leading-tight">
            {multi && (
              <span className="text-[10px] font-body font-medium text-muted-foreground tabular-nums w-9 shrink-0">
                {anio}
              </span>
            )}
            <p
              className={`font-display font-semibold text-foreground ${
                multi ? "text-sm" : "text-lg"
              }`}
            >
              {texto}
              {unit && (
                <span className="text-xs font-body font-normal text-muted-foreground ml-1">
                  {unit}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
