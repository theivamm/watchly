import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clapperboard, Calendar, Globe, Languages, Clock, Star,
  Users, RotateCw, Sparkles, BookOpen, Share2, AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getMyDna, calculateDna } from "@/services/dna";
import type { UserDNA, WeightedMetric } from "@/types";
import DNAHero from "@/components/dna/DNAHero";
import DNAConfidence from "@/components/dna/DNAConfidence";
import DNATags from "@/components/dna/DNATags";
import { GenreLegend } from "@/components/dna/GenreFingerprint";

function StatCard({ icon: Icon, title, children }: {
  icon: typeof Clapperboard;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border p-6 md:p-7"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function MetricList({ items, empty }: { items: WeightedMetric[]; empty: string }) {
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

function ChipsList({ items, empty }: { items: WeightedMetric[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{empty}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.key}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
          {item.label} <span className="text-xs font-extrabold opacity-80">{item.percentage}%</span>
        </span>
      ))}
    </div>
  );
}

function RatingCard({ dna }: { dna: UserDNA }) {
  const { average, median, distribution, label, coverage } = dna.ratingProfile;
  const stars = [5, 4, 3, 2, 1];
  const maxCount = Math.max(1, ...stars.map((s) => distribution[String(s)] ?? 0));
  return (
    <StatCard icon={Star} title="Cómo puntuás">
      {average != null ? (
        <div className="space-y-4">
          <div className="flex items-end gap-6">
            <div>
              <p className="text-4xl font-extrabold text-gradient">{average.toFixed(1)}</p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: "var(--text-secondary)" }}>
                promedio · mediana {median?.toFixed(1)}
              </p>
            </div>
            {label && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                {label}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {stars.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-5 text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{s}★</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${((distribution[String(s)] ?? 0) / maxCount) * 100}%`, background: "var(--gradient-accent)" }} />
                </div>
                <span className="w-5 text-right text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{distribution[String(s)] ?? 0}</span>
              </div>
            ))}
          </div>
          {coverage < 0.6 && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Puntuaste el {Math.round(coverage * 100)}% de tus títulos. A más puntuaciones, más precisa es esta sección.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Todavía no puntuaste títulos. Puntuar te ayuda a afinar tu ADN.
        </p>
      )}
    </StatCard>
  );
}

function RuntimeCard({ dna }: { dna: UserDNA }) {
  const { averageMinutes, label } = dna.runtimeProfile;
  if (averageMinutes == null || !label) return null;
  return (
    <StatCard icon={Clock} title="Duración de tus películas">
      <p className="text-4xl font-extrabold text-gradient">{averageMinutes} min</p>
      <p className="text-sm font-bold mt-2" style={{ color: "var(--text-primary)" }}>{label}</p>
    </StatCard>
  );
}

function CreatorsCard({ dna }: { dna: UserDNA }) {
  const { recurringDirectors, recurringCast } = dna;
  if (recurringDirectors.length === 0 && recurringCast.length === 0) return null;
  const list = (items: { name: string; count: number }[]) =>
    items.map((c) => (
      <span key={c.name}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
        style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
        {c.name} <span className="text-xs font-extrabold" style={{ color: "var(--accent-light)" }}>×{c.count}</span>
      </span>
    ));
  return (
    <div className="rounded-3xl border p-6 md:p-7"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Users className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Creadores recurrentes
        </h3>
      </div>
      {recurringDirectors.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Directores</p>
          <div className="flex flex-wrap gap-2">{list(recurringDirectors)}</div>
        </div>
      )}
      {recurringCast.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>Actores</p>
          <div className="flex flex-wrap gap-2">{list(recurringCast)}</div>
        </div>
      )}
    </div>
  );
}

function LockedState({ dna }: { dna: UserDNA }) {
  const progress = Math.min(dna.validTitleCount / 5, 1);
  const pct = Math.round(progress * 100);
  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] border p-8 md:p-12 text-center"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full blur-[90px] animate-glow pointer-events-none"
          style={{ background: "color-mix(in srgb, var(--accent) 30%, transparent)" }} />
        <div className="relative">
          <div className="w-16 h-16 mx-auto rounded-3xl flex items-center justify-center mb-6 animate-float"
            style={{ background: "var(--gradient-accent)", boxShadow: "0 12px 40px -8px color-mix(in srgb, var(--accent) 60%, transparent)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent-light)" }}>
            ADN Audiovisual
          </p>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Tu ADN Audiovisual está tomando forma
          </h1>
          <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: "var(--text-secondary)" }}>
            Agregá 5 títulos que hayas visto para descubrir los primeros rasgos de tu perfil.
          </p>

          <div className="max-w-sm mx-auto mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {dna.validTitleCount} de 5 títulos
              </span>
              <span className="text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>{pct}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: "var(--gradient-accent)", boxShadow: "0 0 14px color-mix(in srgb, var(--accent) 50%, transparent)" }} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-8 mt-8">
            {[
              { icon: BookOpen, text: "Los géneros que más te marcan" },
              { icon: Users, text: "Creadores que vuelven" },
              { icon: Share2, text: "Una pieza para compartir" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-2xl p-4 text-center"
                style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--accent-light)" }} />
                <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            ))}
          </div>

          <Link to="/buscar"
            className="inline-block px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
            Agregar títulos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DNAPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const load = useCallback(async (force = false) => {
    if (!user) return;
    setLoading(true);
    setError("");
    setStale(false);
    try {
      const stored = await getMyDna(user.id);
      let result = stored;
      if (!stored || profile?.dna_dirty || force) {
        try {
          result = await calculateDna(force);
          void refreshProfile();
        } catch {
          if (!stored) throw new Error("No pudimos actualizar tu ADN en este momento.");
          setStale(true);
        }
      }
      setDna(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar tu ADN en este momento.");
    } finally {
      setLoading(false);
    }
  }, [user, profile?.dna_dirty, refreshProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRecalc = async () => {
    setRecalculating(true);
    setError("");
    await load(true);
    setRecalculating(false);
  };

  if (loading && !dna) {
    return (
      <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto space-y-6">
        <div className="h-72 rounded-[2rem] border animate-pulse" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl border animate-pulse" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !dna) {
    return (
      <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-3xl mx-auto">
        <div className="rounded-3xl border p-8 text-center" style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <AlertTriangle className="w-10 h-10 mx-auto mb-4" style={{ color: "var(--accent-light)" }} />
          <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--text-primary)" }}>No pudimos actualizar tu ADN en este momento</h1>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {error}. El módulo de ADN necesita que el edge function calculate-user-dna esté desplegado en Supabase.
          </p>
          <button onClick={() => load(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
            <RotateCw className="w-4 h-4" /> Volver a intentar
          </button>
        </div>
      </div>
    );
  }

  if (!dna) return null;

  if (dna.status === "locked") {
    return (
      <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto">
        <LockedState dna={dna} />
      </div>
    );
  }

  const isEarly = dna.status === "early";
  const showIncompleteNotice =
    dna.validTitleCount >= 5 &&
    (dna.decadeDistribution.length === 0 || dna.countryDistribution.length === 0);

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {stale && (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
            Resultado desactualizado
          </span>
        )}
        <button onClick={handleRecalc} disabled={recalculating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
          <RotateCw className={`w-4 h-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Calculando..." : "Recalcular"}
        </button>
      </div>

      {isEarly && (
        <div className="rounded-3xl border p-5 md:p-6"
          style={{ backgroundColor: "var(--accent-soft)", borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--accent-light)" }}>
            Estas son las primeras señales de tu ADN. Este resultado va a cambiar a medida que agregues más títulos.
          </p>
        </div>
      )}

      <DNAHero dna={dna} />

      {showIncompleteNotice && (
        <div className="rounded-3xl border p-5"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Algunos datos todavía no están disponibles. Tu ADN se completará automáticamente.
          </p>
        </div>
      )}

      <div className="rounded-3xl border p-6 md:p-8"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Géneros principales
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <GenreLegend genres={dna.topGenres} />
          {dna.topGenres.length > 0 && (
            <p className="text-sm leading-relaxed md:pt-2" style={{ color: "var(--text-secondary)" }}>
              Los porcentajes se calculan distribuyendo el peso de cada título entre sus géneros. Un título con
              tres géneros aporta un tercio a cada uno.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard icon={Clapperboard} title="Películas vs series">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Películas</span>
              <span className="text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>{dna.formatDistribution.movie}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Series</span>
              <span className="text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>{dna.formatDistribution.tv}%</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "var(--surface-2)" }}>
              <div style={{ width: `${dna.formatDistribution.movie}%`, background: "var(--gradient-accent)" }} />
              <div style={{ width: `${dna.formatDistribution.tv}%`, background: "var(--accent-3)" }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Según cantidad de títulos, no horas vistas.
            </p>
          </div>
        </StatCard>

        <StatCard icon={Calendar} title="Décadas predominantes">
          <MetricList items={dna.decadeDistribution} empty="Todavía no hay suficiente información de años de estreno." />
        </StatCard>

        <StatCard icon={Globe} title="Países de origen">
          <ChipsList items={dna.countryDistribution} empty="Todavía no hay suficiente información de países." />
          {dna.countryDistribution.length > 0 && (
            <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
              Las coproducciones comparten su peso entre los países.
            </p>
          )}
        </StatCard>

        <StatCard icon={Languages} title="Idiomas originales">
          <ChipsList items={dna.languageDistribution} empty="Todavía no hay suficiente información de idiomas." />
        </StatCard>

        <RatingCard dna={dna} />
        <RuntimeCard dna={dna} />
      </div>

      <CreatorsCard dna={dna} />
      <DNATags tags={dna.tags} />
      <DNAConfidence dna={dna} />
    </div>
  );
}
