import { HeartPulse } from "lucide-react";
import type { UserDNA } from "@/types";
import { dnaGlass } from "@/lib/dnaStyles";

export default function DNAReactions({ dna }: { dna: UserDNA }) {
  const { reactionDistribution, contextCoverage } = dna;
  const coverage = contextCoverage.reactions;

  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <HeartPulse className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Qué te generan las historias
          </h2>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Tus reacciones al terminar cada sesión.
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
        Los porcentajes representan la distribución de las reacciones elegidas. Una sesión puede tener hasta tres.
      </p>

      {reactionDistribution.length === 0 ? (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Todavía no registraste qué te dejaron tus historias. Al guardar una sesión podés elegir hasta 3 reacciones,
          como “Me emocionó” o “Me dejó pensando”.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {reactionDistribution.map((item) => (
            <span key={item.key}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
              style={{
                backgroundColor: "var(--accent-soft)",
                color: "var(--accent-light)",
                border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
              }}>
              {item.label} <span className="text-xs font-extrabold opacity-80">{item.percentage}%</span>
            </span>
          ))}
        </div>
      )}

      {coverage && coverage.sessions > 0 && (
        <p className="text-[11px] font-semibold mt-3" style={{ color: "var(--text-secondary)" }}>
          {coverage.sessions} {coverage.sessions === 1 ? "sesión" : "sesiones"} con reacciones
        </p>
      )}
    </div>
  );
}
