import { Sparkles } from "lucide-react";
import type { UserDNA } from "@/types";

export default function DNAContextTags({ dna }: { dna: UserDNA }) {
  if (dna.contextTags.length === 0) return null;

  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Tus hábitos en pocas palabras
          </h2>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            Etiquetas que resumen cómo y qué sentís al mirar.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {dna.contextTags.map((tag) => (
          <div key={tag.slug} className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
                style={{
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent-light)",
                  border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                }}>
                {tag.label}
              </span>
              <span className="text-xs font-extrabold" style={{ color: "var(--accent-light)" }}>
                {Math.round(tag.score * 100)}%
              </span>
            </div>
            <p className="text-sm mt-2.5 leading-relaxed" style={{ color: "var(--text-primary)" }}>
              {tag.explanation}
            </p>
            <p className="text-[11px] font-semibold mt-2" style={{ color: "var(--text-secondary)" }}>
              Basado en {tag.sampleSize} {tag.sampleSize === 1 ? "sesión" : "sesiones"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
