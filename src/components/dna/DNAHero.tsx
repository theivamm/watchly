import { Sparkles, Clapperboard, Tv, Activity, ShieldCheck } from "lucide-react";
import type { UserDNA } from "@/types";
import { classifyDna } from "@/lib/dnaStatus";
import { dnaGlass } from "@/lib/dnaStyles";
import GenreFingerprint from "./GenreFingerprint";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function DNAHero({ dna }: { dna: UserDNA }) {
  const cls = classifyDna(dna.status);
  return (
    <section className="relative overflow-hidden rounded-[2rem] border p-7 md:p-10"
      style={dnaGlass}>
      <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
        style={{ background: "color-mix(in srgb, var(--accent) 35%, transparent)" }} />
      <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
        style={{ background: "color-mix(in srgb, var(--accent-3) 20%, transparent)" }} />

      <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-1 min-w-0 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
              <Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              {cls.badgeLabel}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-gradient">
            Mi ADN Audiovisual
          </h1>

          {dna.summary && (
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6" style={{ color: "var(--text-primary)" }}>
              {dna.summary}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {[
              { icon: Activity, label: "Títulos", value: String(dna.validTitleCount) },
              { icon: Clapperboard, label: "Películas", value: `${dna.formatDistribution.movie}%` },
              { icon: Tv, label: "Series", value: `${dna.formatDistribution.tv}%` },
              { icon: ShieldCheck, label: "Confianza general", value: `${dna.confidenceScore}/100` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-2xl px-4 py-3"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <Icon className="w-4 h-4 mb-1.5" style={{ color: "var(--accent-light)" }} />
                <p className="text-xl font-extrabold leading-none text-gradient">{value}</p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs mt-5" style={{ color: "var(--text-secondary)" }}>
            Actualizado el {formatDate(dna.calculatedAt)}
          </p>
        </div>

        <div className="shrink-0">
          <GenreFingerprint genres={dna.topGenres} />
        </div>
      </div>
    </section>
  );
}
