import type { WeightedMetric } from "@/types";

const ARC_COLORS = ["var(--accent)", "var(--accent-3)", "#e879f9", "var(--accent-light)", "var(--accent-2)"];

export default function GenreFingerprint({ genres }: { genres: WeightedMetric[] }) {
  const c = 110;
  const shown = genres.slice(0, 5);
  return (
    <svg
      width={240}
      height={240}
      viewBox="0 0 220 220"
      role="img"
      aria-label="Huella visual de los géneros principales"
      className="mx-auto"
    >
      <circle cx={c} cy={c} r={52} fill="none" stroke="var(--accent)" strokeWidth={0.5} opacity={0.3} />
      {shown.map((g, i) => {
        const r = 30 + i * 18;
        const circ = 2 * Math.PI * r;
        const len = (g.percentage / 100) * circ;
        return (
          <circle
            key={g.key}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={ARC_COLORS[i % ARC_COLORS.length]}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${Math.max(len, 0)} ${circ}`}
            transform="rotate(-90 110 110)"
            opacity={0.95}
          />
        );
      })}
      <circle cx={c} cy={c} r={7} fill="var(--accent-light)" opacity={0.9} />
    </svg>
  );
}

export function GenreLegend({ genres }: { genres: WeightedMetric[] }) {
  return (
    <div className="space-y-4">
      {genres.slice(0, 5).map((g, i) => (
        <div key={g.key}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: ARC_COLORS[i % ARC_COLORS.length] }} />
              {g.label}
            </span>
            <span className="text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>{g.percentage}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${g.percentage}%`,
                background: `linear-gradient(90deg, var(--accent), ${ARC_COLORS[i % ARC_COLORS.length]})`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
