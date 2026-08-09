import { MonitorPlay, MapPin, Clock, Users, Languages, TabletSmartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { UserDNA, WeightedMetric, ContextCoverageItem } from "@/types";
import { buildWatchingHabitsPhrase } from "@/lib/dnaPhrase";
import { dnaGlass } from "@/lib/dnaStyles";

function Bars({ items, empty }: { items: WeightedMetric[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{empty}</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.label}</span>
            <span className="text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>{item.percentage}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
            <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, background: "var(--gradient-accent)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HabitsCard({
  icon: Icon,
  title,
  items,
  empty,
  coverage,
}: {
  icon: LucideIcon;
  title: string;
  items: WeightedMetric[];
  empty: string;
  coverage?: ContextCoverageItem;
}) {
  return (
    <div className="rounded-3xl border p-6"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      <Bars items={items} empty={empty} />
      {coverage && coverage.sessions > 0 && (
        <p className="text-[11px] font-semibold mt-3" style={{ color: "var(--text-secondary)" }}>
          {coverage.sessions} {coverage.sessions === 1 ? "sesión" : "sesiones"} registradas
        </p>
      )}
    </div>
  );
}

export default function DNAWatchingHabits({ dna }: { dna: UserDNA }) {
  const {
    venueDistribution,
    timeDistribution,
    companionshipDistribution,
    languageModeDistribution,
    platformDistribution,
    contextCoverage,
  } = dna;

  const hasAny =
    venueDistribution.length > 0 ||
    timeDistribution.length > 0 ||
    companionshipDistribution.length > 0 ||
    languageModeDistribution.length > 0 ||
    platformDistribution.length > 0;

  const phrase = buildWatchingHabitsPhrase(dna);

  return (
    <div className="rounded-3xl border p-6 md:p-8"
      style={dnaGlass}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <MonitorPlay className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Cómo mirás
          </h2>
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            El contexto de tus sesiones: dónde, cuándo y con quién.
          </p>
        </div>
      </div>

      {!hasAny ? (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Todavía no registraste cómo viste tus historias. En la ficha de cada título podés anotar dónde, cuándo y con
          quién, y esta sección se va a ir completando sola.
        </p>
      ) : (
        <>
          {phrase && (
            <div className="rounded-2xl p-5 mb-6"
              style={{ backgroundColor: "var(--accent-soft)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
              <p className="text-sm leading-relaxed font-bold" style={{ color: "var(--text-primary)" }}>
                {phrase.text}
              </p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-secondary)" }}>
                {phrase.disclaimer}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <HabitsCard
              icon={MapPin}
              title="Dónde lo ves"
              items={venueDistribution}
              empty="Sin datos de lugar todavía."
              coverage={contextCoverage.venue}
            />
            <HabitsCard
              icon={Clock}
              title="Cuándo lo ves"
              items={timeDistribution}
              empty="Sin datos de horario todavía."
              coverage={contextCoverage.time}
            />
            <HabitsCard
              icon={Users}
              title="Con quién"
              items={companionshipDistribution}
              empty="Sin datos de compañía todavía."
              coverage={contextCoverage.companionship}
            />
            <HabitsCard
              icon={Languages}
              title="Idioma en que lo ves"
              items={languageModeDistribution}
              empty="Sin datos de idioma todavía."
              coverage={contextCoverage.language}
            />
            <HabitsCard
              icon={TabletSmartphone}
              title="Cómo lo ves"
              items={platformDistribution}
              empty="Sin datos de plataforma todavía."
              coverage={contextCoverage.platform}
            />
          </div>
        </>
      )}
    </div>
  );
}
