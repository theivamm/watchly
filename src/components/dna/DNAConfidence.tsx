import { ShieldCheck, Info } from "lucide-react";
import type { UserDNA } from "@/types";
import { classifyDna } from "@/lib/dnaStatus";
import { dnaGlass } from "@/lib/dnaStyles";

export default function DNAConfidence({ dna }: { dna: UserDNA }) {
  const cls = classifyDna(dna.status);
  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Nivel de confianza
        </h2>
      </div>

      <div className="flex items-center gap-5 mb-4">
        <p className="text-4xl font-extrabold text-gradient">{dna.confidenceScore}/100</p>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
          {cls.label}
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden mb-5" style={{ backgroundColor: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(dna.confidenceScore, 100)}%`,
            background: "var(--gradient-accent)",
            boxShadow: "0 0 16px color-mix(in srgb, var(--accent) 50%, transparent)",
          }} />
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        Este ADN se calcula con {dna.validTitleCount} {dna.validTitleCount === 1 ? "título" : "títulos"} y seguirá
        cambiando cuando actualices tu biblioteca. La confianza crece con la cantidad de títulos, la metadata
        disponible y tus puntuaciones.
      </p>

      <div className="flex items-start gap-3 rounded-2xl p-4"
        style={{ backgroundColor: "var(--surface-2)", border: "1.5px solid var(--border)" }}>
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          El ADN es descriptivo, no un test de personalidad. Se genera con reglas deterministas a partir de los
          títulos terminados (y las series que estás viendo), ponderados por estado y calificación. No se usan
          modelos de lenguaje ni inferencias psicológicas.
        </p>
      </div>
    </div>
  );
}
