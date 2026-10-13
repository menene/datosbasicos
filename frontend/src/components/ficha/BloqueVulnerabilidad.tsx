import { ShieldAlert } from "lucide-react";
import type { CategoriaVulnerabilidad, Municipio } from "@/types/municipio";

const NUM = new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLOR_CATEGORIA: Record<CategoriaVulnerabilidad, string> = {
  "muy baja": "bg-selva/10 text-selva",
  baja: "bg-selva/10 text-selva",
  media: "bg-maiz/20 text-tierra",
  alta: "bg-[#FAE0CC] text-[#8B2500]",
  "muy alta": "bg-[#8B2500] text-white",
};

const AMBITOS: Array<{ key: keyof Municipio; label: string }> = [
  { key: "vuln_servicios", label: "Servicios básicos" },
  { key: "vuln_educacion", label: "Educación" },
  { key: "vuln_equipamiento", label: "Equipamiento" },
  { key: "vuln_empleo", label: "Empleo" },
  { key: "vuln_sociodemografica", label: "Sociodemográfica" },
  { key: "vuln_vivienda", label: "Vivienda" },
];

/**
 * Índice de vulnerabilidad social multidimensional del municipio, con su categoría,
 * su puesto entre los 340 y el aporte de cada ámbito. Fuente: Tercero et al.,
 * Clavius 1(1), 2023 — con datos del Censo 2018.
 */
export default function BloqueVulnerabilidad({
  municipio,
  compacto = false,
}: {
  municipio: Municipio;
  compacto?: boolean;
}) {
  const total = municipio.vulnerabilidad_social;
  if (total === null) return null;
  const cat = municipio.vulnerabilidad_categoria;

  return (
    <div className={compacto ? "" : "rounded-xl border border-border bg-white p-5"}>
      <p className="text-xs text-muted-foreground font-body mb-2 flex items-center gap-1.5">
        <ShieldAlert size={13} className="text-[#8B2500] shrink-0" />
        Vulnerabilidad social multidimensional
      </p>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-3">
        <span className="font-display font-bold text-foreground text-2xl tabular-nums">
          {NUM.format(total)}
        </span>
        {cat && (
          <span className={`text-xs font-body font-medium px-2 py-0.5 rounded-full ${COLOR_CATEGORIA[cat]}`}>
            {cat}
          </span>
        )}
        {municipio.vulnerabilidad_ranking !== null && (
          <span className="text-xs text-muted-foreground font-body">
            puesto {municipio.vulnerabilidad_ranking} de 340 (1 = más vulnerable)
          </span>
        )}
      </div>

      {/* Aporte de cada ámbito: el índice es su suma */}
      <ul className="space-y-1.5">
        {AMBITOS.map(({ key, label }) => {
          const v = municipio[key] as number | null;
          if (v === null) return null;
          return (
            <li key={key} className="grid grid-cols-[7.5rem_1fr_2.5rem] items-center gap-2 text-xs font-body">
              <span className="text-muted-foreground truncate">{label}</span>
              <span className="h-1.5 rounded-full bg-muted overflow-hidden">
                <span
                  className="block h-full rounded-full bg-[#8B2500]/70"
                  style={{ width: `${Math.min(100, (v / total) * 100)}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-foreground">{NUM.format(v)}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-[10px] text-muted-foreground/70 font-body mt-3 leading-snug">
        Suma de seis ámbitos; mayor valor = más vulnerable. Tercero et al., <em>Clavius</em> 1(1),
        2023, con datos del Censo 2018.
      </p>
    </div>
  );
}
