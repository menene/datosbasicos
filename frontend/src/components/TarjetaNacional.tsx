import { Flag } from "lucide-react";

export interface StatNacional {
  label: string;
  valor: string;
  /** Optional secondary line (e.g. "promedio de 22 deptos."). */
  sub?: string;
}

/**
 * Compact "national total" card, visually consistent across the data pages.
 * Shows one or more headline figures for Guatemala as a whole.
 */
export default function TarjetaNacional({
  stats,
  nota,
  className = "",
}: {
  stats: StatNacional[];
  nota?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-selva/25 bg-selva/[0.04] p-4 ${className}`}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Flag size={12} className="text-selva shrink-0" />
        <span className="text-[11px] font-body font-semibold tracking-widest uppercase text-selva">
          Guatemala · Total nacional
        </span>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))` }}>
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="font-display font-bold text-foreground text-xl leading-none tabular-nums">
              {s.valor}
            </p>
            <p className="text-xs text-muted-foreground font-body mt-1 leading-tight">
              {s.label}
            </p>
            {s.sub && (
              <p className="text-[10px] text-muted-foreground/70 font-body mt-0.5 leading-tight">
                {s.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {nota && (
        <p className="text-[10px] text-muted-foreground/70 font-body mt-3 leading-snug">
          {nota}
        </p>
      )}
    </div>
  );
}
