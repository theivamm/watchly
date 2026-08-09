import { Repeat } from "lucide-react";
import type { UserDNA } from "@/types";
import { dnaGlass } from "@/lib/dnaStyles";

export default function DNARewatch({ dna }: { dna: UserDNA }) {
  const { rewatchProfile } = dna;
  const { totalSessions, uniqueTitles, rewatchSessions, rewatchRate } = rewatchProfile;

  if (totalSessions === 0) return null;

  const stats = [
    { label: "Sesiones registradas", value: String(totalSessions) },
    { label: "Títulos únicos", value: String(uniqueTitles) },
    { label: "Rewatches", value: String(rewatchSessions) },
    { label: "Tasa de rewatch", value: `${Math.round(rewatchRate * 100)}%` },
  ];

  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Repeat className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Volver a ver
          </h2>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            La relación entre tus rewatches y tus sesiones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-3xl font-extrabold text-gradient">{s.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest mt-2" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
