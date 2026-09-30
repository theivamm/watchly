import "@/styles/cinema.css";
import { useState, type ReactNode } from "react";
import {
  Sparkles, Clapperboard, Tv, Calendar, Globe, Languages, Star, Clock, Users, MapPin, MonitorPlay,
  TabletSmartphone, Repeat, ShieldCheck, Activity, Dna, Heart, Tags, Film,
} from "lucide-react";
import type { UserDNA, WeightedMetric } from "@/types";
import { classifyDna } from "@/lib/dnaStatus";
import { buildWatchingHabitsPhrase } from "@/lib/dnaPhrase";

const label = "text-xs font-extrabold uppercase tracking-widest text-white/60";
const hueColor = (i: number) => `hsl(calc(var(--accent-h, 265) + ${i * 34}) 78% 64%)`;
const accentColor = "hsl(var(--accent-h, 265) 80% 66%)";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function Panel({ icon: Icon, title, hint, children, className = "" }: {
  icon: typeof Star; title: string; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <section className={`liquid-glass rounded-[2.25rem] p-6 md:p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: accentColor, boxShadow: "0 8px 24px -6px " + accentColor }}>
          <Icon className="w-5 h-5 text-[#0b0b14]" />
        </span>
        <div className="min-w-0">
          <h3 className="font-cinema text-3xl leading-none">{title}</h3>
          {hint && <p className="text-[11px] font-bold text-white/60 mt-1.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-white/65 leading-relaxed">{text}</p>;
}

function RankBars({ items, empty, colored = false }: { items: WeightedMetric[]; empty: string; colored?: boolean }) {
  if (items.length === 0) return <Empty text={empty} />;
  return (
    <div className="space-y-3.5">
      {items.map((item, i) => (
        <div key={item.key} className="flex items-center gap-4">
          <span className="font-cinema text-2xl w-8 text-white/45 leading-none">{String(i + 1).padStart(2, "0")}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <span className="text-sm font-extrabold truncate">{item.label}</span>
              <span className="text-sm font-extrabold text-white/80 shrink-0">{item.percentage}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, background: colored ? hueColor(i) : accentColor }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Chips({ items, empty }: { items: WeightedMetric[]; empty: string }) {
  if (items.length === 0) return <Empty text={empty} />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it.key} className="frost-card inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold">
          {it.label} <span className="text-xs font-extrabold text-white/60">{it.percentage}%</span>
        </span>
      ))}
    </div>
  );
}

function Donut({ genres }: { genres: WeightedMetric[] }) {
  const top = genres.slice(0, 6);
  let acc = 0;
  const stops = top.map((g, i) => {
    const from = acc;
    acc = Math.min(100, acc + g.percentage);
    return `${hueColor(i)} ${from}% ${acc}%`;
  });
  if (acc < 100) stops.push(`rgba(255,255,255,.14) ${acc}% 100%`);
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative w-56 h-56 shrink-0">
        <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${stops.join(", ")})`, boxShadow: "0 30px 70px -20px " + accentColor }} />
        <div className="absolute inset-[26px] rounded-full liquid-glass flex flex-col items-center justify-center text-center">
          <Dna className="w-6 h-6 mb-1 text-white/70" />
          <p className="font-cinema text-3xl leading-none">{top[0]?.label ?? "—"}</p>
          <p className="text-[11px] font-bold text-white/60 mt-1">{top[0] ? `${top[0].percentage}% de tu ADN` : ""}</p>
        </div>
      </div>
      <ul className="space-y-2.5 min-w-0">
        {top.map((g, i) => (
          <li key={g.key} className="flex items-center gap-3 text-sm font-extrabold">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: hueColor(i) }} />
            <span className="truncate">{g.label}</span>
            <span className="text-white/60 ml-auto pl-4">{g.percentage}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HabitBlock({ icon: Icon, title, items, empty, sessions }: {
  icon: typeof MapPin; title: string; items: WeightedMetric[]; empty: string; sessions?: number;
}) {
  return (
    <div className="frost-card rounded-[1.75rem] p-5">
      <p className="text-sm font-extrabold inline-flex items-center gap-2 mb-4"><Icon className="w-4 h-4 text-white/70" /> {title}</p>
      {items.length === 0 ? <Empty text={empty} /> : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.key}>
              <div className="flex justify-between text-xs font-extrabold mb-1.5"><span>{it.label}</span><span className="text-white/70">{it.percentage}%</span></div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${it.percentage}%`, background: accentColor }} /></div>
            </div>
          ))}
        </div>
      )}
      {sessions ? <p className="text-[11px] font-bold text-white/55 mt-4">{sessions} {sessions === 1 ? "sesión" : "sesiones"}</p> : null}
    </div>
  );
}

type Tab = "gustos" | "habitos" | "perfil";

export default function DNAView({ dna, title = "Mi ADN", owner, actions }: {
  dna: UserDNA; title?: string; owner?: string; actions?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("gustos");
  const cls = classifyDna(dna.status);
  const phrase = buildWatchingHabitsPhrase(dna);
  const { average, median, distribution, label: ratingLabel, coverage } = dna.ratingProfile;
  const stars = [5, 4, 3, 2, 1];
  const maxStar = Math.max(1, ...stars.map((s) => distribution[String(s)] ?? 0));
  const maxDecade = Math.max(1, ...dna.decadeDistribution.map((d) => d.percentage));
  const cov = dna.contextCoverage;
  const hasHabits = [dna.venueDistribution, dna.timeDistribution, dna.companionshipDistribution, dna.languageModeDistribution, dna.platformDistribution].some((l) => l.length > 0);
  const tabs: { key: Tab; label: string; icon: typeof Film }[] = [
    { key: "gustos", label: "Gustos", icon: Heart },
    { key: "habitos", label: "Cómo mirás", icon: MonitorPlay },
    { key: "perfil", label: "Perfil y confianza", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8 text-white">
      {/* ───────── HERO ───────── */}
      <section className="liquid-glass relative overflow-hidden rounded-[2.75rem] p-7 md:p-12">
        <div className="absolute -top-32 -right-24 w-[460px] h-[460px] rounded-full blur-[120px] opacity-50 pointer-events-none" style={{ background: accentColor }} />
        <div className="relative grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,auto)] xl:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual</span>
              <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{cls.badgeLabel}</span>
              {owner && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">@{owner}</span>}
            </div>
            <h1 className="font-cinema text-6xl md:text-8xl leading-[1.02] drop-shadow-[0_10px_50px_rgba(0,0,0,.5)] break-words">{title}</h1>
            {dna.summary && <p className="mt-5 text-lg md:text-xl leading-relaxed font-medium text-white/90 max-w-2xl text-pretty">{dna.summary}</p>}
            {dna.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {dna.tags.map((t) => <span key={t} className="frost-card inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold"><Tags className="w-3 h-3 text-white/60" /> {t}</span>)}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl">
              {[
                { icon: Activity, label: "Títulos", value: String(dna.validTitleCount) },
                { icon: Clapperboard, label: "Películas", value: `${dna.formatDistribution.movie}%` },
                { icon: Tv, label: "Series", value: `${dna.formatDistribution.tv}%` },
                { icon: ShieldCheck, label: "Confianza", value: `${dna.confidenceScore}/100` },
              ].map(({ icon: Icon, label: l, value }) => (
                <div key={l} className="frost-card rounded-[1.5rem] px-4 py-4">
                  <Icon className="w-4 h-4 mb-2 text-white/60" />
                  <p className="font-cinema text-3xl leading-none">{value}</p>
                  <p className="text-[11px] font-extrabold mt-1.5 text-white/70">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-6">
              <p className="text-xs font-bold text-white/55">Actualizado el {formatDate(dna.calculatedAt)}</p>
              {actions}
            </div>
          </div>
          {dna.topGenres.length > 0 && <Donut genres={dna.topGenres} />}
        </div>
      </section>

      {/* ───────── PESTAÑAS ───────── */}
      <nav className="liquid-glass sticky top-4 z-30 rounded-full p-2 flex gap-1.5 overflow-x-auto no-scrollbar w-fit max-w-full">
        {tabs.map(({ key, label: l, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className="flex items-center gap-2 px-5 h-11 rounded-full text-sm font-extrabold whitespace-nowrap transition-all"
            style={{ background: tab === key ? "#fff" : "transparent", color: tab === key ? "#111" : "rgba(255,255,255,.85)" }}>
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </nav>

      {/* ───────── GUSTOS ───────── */}
      {tab === "gustos" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel icon={Film} title="Géneros principales" hint="Cada título reparte su peso entre sus géneros" className="lg:col-span-7">
            <RankBars items={dna.topGenres} empty="Todavía no hay géneros suficientes." colored />
          </Panel>

          <div className="lg:col-span-5 space-y-6">
            <Panel icon={Clapperboard} title="Películas vs series" hint="Según cantidad de títulos, no horas">
              <div className="flex items-end justify-between mb-3">
                <div><p className="font-cinema text-5xl leading-none">{dna.formatDistribution.movie}%</p><p className="text-xs font-extrabold text-white/70 mt-1.5">Películas</p></div>
                <div className="text-right"><p className="font-cinema text-5xl leading-none">{dna.formatDistribution.tv}%</p><p className="text-xs font-extrabold text-white/70 mt-1.5">Series</p></div>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex bg-white/10">
                <div style={{ width: `${dna.formatDistribution.movie}%`, background: hueColor(0) }} />
                <div style={{ width: `${dna.formatDistribution.tv}%`, background: hueColor(3) }} />
              </div>
            </Panel>
            {dna.runtimeProfile.averageMinutes != null && dna.runtimeProfile.label && (
              <Panel icon={Clock} title="Duración" hint="Promedio de tus películas">
                <p className="font-cinema text-6xl leading-none">{dna.runtimeProfile.averageMinutes}<span className="text-2xl ml-2 text-white/60">min</span></p>
                <p className="text-sm font-extrabold mt-3 text-white/85">{dna.runtimeProfile.label}</p>
              </Panel>
            )}
          </div>

          <Panel icon={Calendar} title="Décadas" hint="De qué época son tus títulos" className="lg:col-span-7">
            {dna.decadeDistribution.length === 0 ? <Empty text="Todavía no hay suficiente información de años de estreno." /> : (
              <div className="flex items-end gap-3 h-48">
                {dna.decadeDistribution.map((d, i) => (
                  <div key={d.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2 min-w-0">
                    <span className="text-xs font-extrabold text-white/80">{d.percentage}%</span>
                    <div className="w-full rounded-t-2xl" style={{ height: `${Math.max(8, (d.percentage / maxDecade) * 100)}%`, background: hueColor(i) }} />
                    <span className="text-[11px] font-extrabold text-white/70 truncate w-full text-center">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel icon={Star} title="Cómo puntuás" className="lg:col-span-5">
            {average != null ? (
              <div className="space-y-5">
                <div className="flex items-end gap-5">
                  <p className="font-cinema text-7xl leading-none">{average.toFixed(1)}</p>
                  <div className="pb-1.5">
                    {ratingLabel && <span className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-xs font-extrabold">{ratingLabel}</span>}
                    <p className="text-[11px] font-bold text-white/60 mt-2">mediana {median?.toFixed(1)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {stars.map((s) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className="w-6 text-xs font-extrabold text-white/70">{s}★</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${((distribution[String(s)] ?? 0) / maxStar) * 100}%`, background: accentColor }} /></div>
                      <span className="w-5 text-right text-xs font-extrabold text-white/70">{distribution[String(s)] ?? 0}</span>
                    </div>
                  ))}
                </div>
                {coverage < 0.6 && <p className="text-xs text-white/60">Puntuaste el {Math.round(coverage * 100)}% de tus títulos. A más puntuaciones, más precisa es esta sección.</p>}
              </div>
            ) : <Empty text="Todavía no puntuaste títulos. Puntuar te ayuda a afinar tu ADN." />}
          </Panel>

          <Panel icon={Globe} title="Países de origen" hint="Las coproducciones reparten su peso" className="lg:col-span-6">
            <Chips items={dna.countryDistribution} empty="Todavía no hay suficiente información de países." />
          </Panel>
          <Panel icon={Languages} title="Idiomas originales" className="lg:col-span-6">
            <Chips items={dna.languageDistribution} empty="Todavía no hay suficiente información de idiomas." />
          </Panel>

          {(dna.recurringDirectors.length > 0 || dna.recurringCast.length > 0) && (
            <Panel icon={Users} title="Creadores recurrentes" className="lg:col-span-12">
              <div className="grid gap-6 md:grid-cols-2">
                {[{ t: "Directores", l: dna.recurringDirectors }, { t: "Actores", l: dna.recurringCast }].filter((g) => g.l.length > 0).map((g) => (
                  <div key={g.t}>
                    <p className={`${label} mb-3`}>{g.t}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.l.map((c) => <span key={c.name} className="frost-card inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold">{c.name} <span className="text-xs font-extrabold text-white/60">×{c.count}</span></span>)}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ───────── CÓMO MIRÁS ───────── */}
      {tab === "habitos" && (
        <div className="space-y-6">
          {!hasHabits ? (
            <Panel icon={MonitorPlay} title="Cómo mirás">
              <Empty text="Todavía no hay sesiones registradas. En la ficha de cada título podés anotar dónde, cuándo y con quién lo viste, y esta sección se completa sola." />
            </Panel>
          ) : (
            <>
              {phrase && (
                <div className="liquid-glass rounded-[2.25rem] p-7 md:p-9">
                  <p className="font-cinema text-3xl md:text-4xl leading-tight text-pretty">{phrase.text}</p>
                  <p className="text-xs font-bold text-white/60 mt-3">{phrase.disclaimer}</p>
                </div>
              )}
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <HabitBlock icon={MapPin} title="Dónde lo ves" items={dna.venueDistribution} empty="Sin datos de lugar todavía." sessions={cov.venue?.sessions} />
                <HabitBlock icon={Clock} title="Cuándo lo ves" items={dna.timeDistribution} empty="Sin datos de horario todavía." sessions={cov.time?.sessions} />
                <HabitBlock icon={Users} title="Con quién" items={dna.companionshipDistribution} empty="Sin datos de compañía todavía." sessions={cov.companionship?.sessions} />
                <HabitBlock icon={Languages} title="Idioma en que lo ves" items={dna.languageModeDistribution} empty="Sin datos de idioma todavía." sessions={cov.language?.sessions} />
                <HabitBlock icon={TabletSmartphone} title="Cómo lo ves" items={dna.platformDistribution} empty="Sin datos de plataforma todavía." sessions={cov.platform?.sessions} />
                <div className="frost-card rounded-[1.75rem] p-5">
                  <p className="text-sm font-extrabold inline-flex items-center gap-2 mb-4"><Repeat className="w-4 h-4 text-white/70" /> Re-ver</p>
                  <p className="font-cinema text-6xl leading-none">{Math.round(dna.rewatchProfile.rewatchRate * (dna.rewatchProfile.rewatchRate <= 1 ? 100 : 1))}%</p>
                  <p className="text-xs font-bold text-white/65 mt-3">{dna.rewatchProfile.rewatchSessions} re-vistas · {dna.rewatchProfile.uniqueTitles} títulos únicos · {dna.rewatchProfile.totalSessions} sesiones</p>
                </div>
              </div>
            </>
          )}
          {dna.reactionDistribution.length > 0 && (
            <Panel icon={Heart} title="Qué te dejan" hint="Reacciones que más elegís">
              <div className="flex flex-wrap gap-2.5">
                {dna.reactionDistribution.map((r, i) => (
                  <span key={r.key} className="frost-card inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-extrabold" style={{ fontSize: `${0.8 + Math.min(r.percentage, 40) / 100}rem` }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: hueColor(i) }} /> {r.label}
                    <span className="text-xs text-white/60">{r.percentage}%</span>
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ───────── PERFIL Y CONFIANZA ───────── */}
      {tab === "perfil" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Panel icon={Sparkles} title="Tu perfil de espectador" hint="Etiquetas calculadas con reglas, sin IA" className="lg:col-span-7">
            {dna.contextTags.length === 0 ? <Empty text="Todavía no hay suficientes sesiones para inferir un perfil." /> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {dna.contextTags.map((t, i) => {
                  const pct = Math.round(t.score <= 1 ? t.score * 100 : t.score);
                  return (
                    <div key={t.slug} className="frost-card rounded-[1.5rem] p-5">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="font-cinema text-2xl leading-tight">{t.label}</p>
                        <span className="text-xs font-extrabold text-white/70">{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: hueColor(i) }} /></div>
                      <p className="text-xs leading-relaxed text-white/75">{t.explanation}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <div className="lg:col-span-5 space-y-6">
            <Panel icon={ShieldCheck} title="Confianza del ADN" hint={cls.hint}>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32 shrink-0">
                  <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${accentColor} ${dna.confidenceScore}%, rgba(255,255,255,.14) 0)` }} />
                  <div className="absolute inset-[10px] rounded-full liquid-glass flex items-center justify-center"><span className="font-cinema text-4xl">{dna.confidenceScore}</span></div>
                </div>
                <div className="space-y-1.5 text-sm font-bold text-white/80">
                  <p>{dna.validTitleCount} títulos válidos</p>
                  <p>{dna.ratedTitleCount} puntuados</p>
                  <p className="text-white/55 text-xs">{cls.label}</p>
                </div>
              </div>
            </Panel>
            {Object.keys(cov).length > 0 && (
              <Panel icon={Activity} title="Cobertura del contexto">
                <div className="space-y-3">
                  {Object.entries(cov).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 text-sm font-extrabold">
                      <span>{v.label}</span>
                      <span className="text-xs text-white/65">{v.sessions} {v.sessions === 1 ? "sesión" : "sesiones"} · {v.level}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
