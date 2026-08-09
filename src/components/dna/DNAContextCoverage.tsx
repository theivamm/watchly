import { Gauge } from "lucide-react";
import type { UserDNA, ContextCoverage } from "@/types";
import { dnaGlass } from "@/lib/dnaStyles";

const DIMENSION_LABELS: Record<string, string> = {
  venue: "Lugar",
  time: "Horario",
  companionship: "Compañía",
  language: "Idioma",
  platform: "Plataforma",
  reactions: "Reacciones",
};

export default function DNAContextCoverage({ dna }: { dna: UserDNA }) {
  const coverage: ContextCoverage = dna.contextCoverage ?? {};
  const dims = Object.keys(DIMENSION_LABELS);
  const hasAny = dims.some((d) => (coverage[d]?.sessions ?? 0) > 0);

  if (!hasAny) return null;

  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Gauge className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Cobertura de datos
          </h2>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Cuánto pesa cada dimensión en este ADN.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {dims.map((d) => {
          const item = coverage[d];
          const sessions = item?.sessions ?? 0;
          return (
            <div key={d} className="rounded-2xl p-4"
              style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-extrabold" style={{ color: "var(--text-primary)" }}>
                {DIMENSION_LABELS[d]}
              </p>
              <p className="text-2xl font-extrabold text-gradient mt-1">{sessions}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-secondary)" }}>
                {item?.label ?? "Sin datos"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
