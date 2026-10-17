import "@/styles/cinema.css";
import { useEffect, useState, type ReactNode } from "react";
import { Sparkles, Clock, MonitorPlay, ShieldCheck, Heart, Film } from "lucide-react";
import type { UserDNA, WeightedMetric } from "@/types";
import { classifyDna } from "@/lib/dnaStatus";
import { buildWatchingHabitsPhrase } from "@/lib/dnaPhrase";
import { getPosterUrl } from "@/services/tmdb";

const label = "text-xs font-extrabold uppercase tracking-widest text-white/60";
const PALETTE = ["#ff6b8a", "#ffb457", "#f4e062", "#7ee08f", "#6cc7ff", "#b794ff"];
const hueColor = (i: number) => PALETTE[i % PALETTE.length];
const fringe = "drop-shadow(-2px 0 0 rgba(255,60,120,.85)) drop-shadow(2px 0 0 rgba(60,200,255,.85))";

export interface DnaPoster { path: string; title: string; rating: number | null; type: string }

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function Head({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-cinema text-3xl md:text-4xl leading-none chroma">{title}</h3>
      {hint && <p className="text-[11px] font-bold text-white/65 mt-2">{hint}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-white/65 leading-relaxed">{text}</p>;
}

function Cloud({ items, empty }: { items: WeightedMetric[]; empty: string }) {
  if (items.length === 0) return <Empty text={empty} />;
  return (
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
      {items.map((it, i) => (
        <span key={it.key} className="font-cinema leading-none chroma" style={{ fontSize: `${1.5 + Math.min(it.percentage, 70) / 22}rem`, opacity: 1 - i * 0.07 }}>
          {it.label} <span className="font-sans text-xs font-extrabold text-white/60 align-middle">{it.percentage}%</span>
        </span>
      ))}
    </div>
  );
}

function PosterWall({ posters }: { posters: DnaPoster[] }) {
  if (posters.length === 0) return null;
  const cols = 10;
  const items = Array.from({ length: cols * 3 }, (_, i) => posters[i % posters.length]);
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -inset-[18%] grid gap-3 -rotate-[8deg]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {items.map((p, i) => (
          <img key={i} src={getPosterUrl(p.path, "w200")} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover rounded-xl" style={{ marginTop: (i % cols) % 2 ? 36 : 0 }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.94) 0%, rgba(8,7,14,.72) 38%, rgba(8,7,14,.3) 100%), linear-gradient(180deg, rgba(8,7,14,.25), rgba(8,7,14,.6))" }} />
    </div>
  );
}

function useReady(dep?: unknown) {
  const [r, setR] = useState(false);
  useEffect(() => { setR(false); const t = setTimeout(() => setR(true), 60); return () => clearTimeout(t); }, [dep]);
  return r;
}

function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1000); setN(Math.round(value * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}{suffix}</>;
}

function GenreBubbles({ genres }: { genres: WeightedMetric[] }) {
  const max = Math.max(1, ...genres.map((g) => g.percentage));
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 py-6 min-h-[340px]">
      {genres.map((g, i) => {
        const size = 120 + (g.percentage / max) * 180;
        return (
          <div key={g.key} className="dna-pop" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="transition-transform duration-300 hover:scale-110">
              <div className="dna-bob liquid-glass rounded-full flex flex-col items-center justify-center text-center text-[#0b0b14]"
                style={{ width: size, height: size, animationDuration: `${5 + i * 0.9}s`, animationDelay: `${i * -1.1}s`, background: `radial-gradient(circle at 30% 25%, ${hueColor(i)}, ${hueColor(i)}88 78%)` }}>
                <span className="font-cinema leading-none" style={{ fontSize: size / 3.1 }}><CountUp value={g.percentage} suffix="%" /></span>
                <span className="font-extrabold px-3 leading-tight mt-1" style={{ fontSize: Math.max(11, size / 11) }}>{g.label}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Ring({ pct, size = 160, stroke = 14, children }: { pct: number; size?: number; stroke?: number; children?: ReactNode }) {
  const ready = useReady();
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={ready ? c * (1 - Math.min(100, pct) / 100) : c} style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.2,.8,.2,1)", filter: fringe }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

function StackBar({ items }: { items: WeightedMetric[] }) {
  const ready = useReady();
  return (
    <div>
      <div className="liquid-glass rounded-[1.5rem] p-1 flex gap-1 h-16">
        {items.map((it, i) => (
          <div key={it.key} className="rounded-[1.1rem] transition-all duration-1000 ease-out" style={{ flex: ready ? `${Math.max(it.percentage, 4)} 1 0` : "0 1 0", background: hueColor(i) }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-center gap-2 text-sm font-extrabold"><span className="w-2.5 h-2.5 rounded-full" style={{ background: hueColor(i) }} />{it.label}<span className="text-white/60">{it.percentage}%</span></li>
        ))}
      </ul>
    </div>
  );
}

function Pillars({ items }: { items: WeightedMetric[] }) {
  const ready = useReady();
  const max = Math.max(1, ...items.map((i) => i.percentage));
  return (
    <div className="flex items-end gap-4 h-44">
      {items.map((it, i) => (
        <div key={it.key} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-2">
          <span className="text-xs font-extrabold text-white/80">{it.percentage}%</span>
          <div className="liquid-glass w-full rounded-2xl transition-all duration-1000 ease-out" style={{ height: ready ? `${Math.max(8, (it.percentage / max) * 100)}%` : "4%", background: `linear-gradient(180deg, ${hueColor(i)}, ${hueColor(i)}55)` }} />
          <span className="text-[11px] font-extrabold text-white/80 text-center leading-tight">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function Dots({ items }: { items: WeightedMetric[] }) {
  const max = Math.max(1, ...items.map((i) => i.percentage));
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((it, i) => {
        const size = 76 + (it.percentage / max) * 70;
        return (
          <div key={it.key} className="dna-pop" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="liquid-glass rounded-full flex flex-col items-center justify-center text-center text-[#0b0b14]" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, ${hueColor(i)}, ${hueColor(i)}88 78%)` }}>
              <span className="font-cinema leading-none" style={{ fontSize: size / 3.4 }}>{it.percentage}%</span>
              <span className="text-[10px] font-extrabold px-2 leading-tight mt-0.5">{it.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RankList({ items }: { items: WeightedMetric[] }) {
  const ready = useReady();
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={it.key}>
          <div className="flex items-baseline justify-between gap-3"><span className="font-cinema text-2xl leading-none">{it.label}</span><span className="text-sm font-extrabold text-white/70">{it.percentage}%</span></div>
          <div className="h-[3px] rounded-full bg-white/15 mt-2 overflow-hidden"><div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: ready ? `${it.percentage}%` : "0%", background: hueColor(i) }} /></div>
        </div>
      ))}
    </div>
  );
}

function HabitBlock({ title, sessions, items, empty, children, className = "" }: {
  title: string; sessions?: number; items: WeightedMetric[]; empty: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={className}>
      <Head title={title} hint={sessions ? `${sessions} ${sessions === 1 ? "sesión" : "sesiones"}` : undefined} />
      {items.length === 0 ? <Empty text={empty} /> : children}
    </div>
  );
}

function TagRow({ title, pct, text }: { title: string; pct: number; text: string }) {
  const ready = useReady();
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-center border-t border-white/20 py-6">
      <div className="flex items-baseline gap-4"><span className="font-cinema text-5xl md:text-6xl leading-none">{pct}%</span><span className="font-cinema text-2xl md:text-3xl leading-tight text-white/90">{title}</span></div>
      <div>
        <div className="h-[3px] rounded-full bg-white/15 overflow-hidden mb-3"><div className="h-full rounded-full bg-white transition-all duration-1000 ease-out" style={{ width: ready ? `${pct}%` : "0%", filter: fringe }} /></div>
        <p className="text-sm leading-relaxed text-white/80">{text}</p>
      </div>
    </div>
  );
}

type Tab = "gustos" | "habitos" | "perfil";

export default function DNAView({ dna, title = "Mi ADN", owner, actions, posters = [] }: {
  dna: UserDNA; title?: string; owner?: string; actions?: ReactNode; posters?: DnaPoster[];
}) {
  const [tab, setTab] = useState<Tab>("gustos");
  const cls = classifyDna(dna.status);
  const phrase = buildWatchingHabitsPhrase(dna);
  const { average, median, distribution, label: ratingLabel, coverage } = dna.ratingProfile;
  const stars = [1, 2, 3, 4, 5];
  const maxStar = Math.max(1, ...stars.map((s) => distribution[String(s)] ?? 0));
  const maxDecade = Math.max(1, ...dna.decadeDistribution.map((d) => d.percentage));
  const cov = dna.contextCoverage;
  const hasHabits = [dna.venueDistribution, dna.timeDistribution, dna.companionshipDistribution, dna.languageModeDistribution, dna.platformDistribution].some((l) => l.length > 0);
  const topRated = [...posters].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 8);
  const movieP = posters.filter((p) => p.type === "movie").slice(0, 4);
  const tvP = posters.filter((p) => p.type !== "movie").slice(0, 4);
  const rewatchPct = Math.round(dna.rewatchProfile.rewatchRate * (dna.rewatchProfile.rewatchRate <= 1 ? 100 : 1));
  const split = Math.min(72, Math.max(28, dna.formatDistribution.movie));
  const genres = dna.topGenres.slice(0, 6);
  const tabs: { key: Tab; label: string; icon: typeof Film }[] = [
    { key: "gustos", label: "Gustos", icon: Heart },
    { key: "habitos", label: "Cómo mirás", icon: MonitorPlay },
    { key: "perfil", label: "Perfil y confianza", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-10 text-white">
      {/* ───────── HEADER ───────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 min-h-[500px] flex flex-col justify-between gap-10 p-7 md:p-12"
        style={{ boxShadow: "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4), 0 30px 80px -20px rgba(0,0,0,.6)", background: posters.length ? undefined : "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))" }}>
        <PosterWall posters={posters} />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual</span>
            <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{cls.badgeLabel}</span>
            {owner && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">@{owner}</span>}
          </div>
          <h1 className="font-cinema chroma text-7xl md:text-[10rem] leading-[0.95] break-words">{title}</h1>
          {dna.summary && <p className="mt-5 text-lg md:text-xl leading-relaxed font-medium text-white/90 max-w-3xl text-pretty">{dna.summary}</p>}
          {dna.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5">
              {dna.tags.map((t) => <span key={t} className="liquid-glass-sm px-4 py-1.5 rounded-full text-xs font-extrabold">{t}</span>)}
            </div>
          )}
        </div>
        <div className="relative">
          <div className="liquid-glass rounded-[2rem] grid grid-cols-2 md:grid-cols-5 [&>div]:px-6 [&>div]:py-5 [&>div+div]:md:border-l [&>div+div]:border-white/15">
            {[
              { l: "Títulos", v: String(dna.validTitleCount) },
              { l: "Películas", v: `${dna.formatDistribution.movie}%` },
              { l: "Series", v: `${dna.formatDistribution.tv}%` },
              { l: "Confianza", v: `${dna.confidenceScore}/100` },
              { l: "Género #1", v: genres[0]?.label ?? "—" },
            ].map(({ l, v: val }) => (
              <div key={l} className="min-w-0">
                <p className="font-cinema text-3xl md:text-4xl leading-none truncate">{val}</p>
                <p className="text-[11px] font-extrabold uppercase tracking-widest mt-2 text-white/65">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <p className="text-xs font-bold text-white/65">Actualizado el {formatDate(dna.calculatedAt)}</p>
            {actions}
          </div>
        </div>
      </section>

      {/* ───────── PESTAÑAS ───────── */}
      <nav className="flex gap-2 md:gap-8 border-b border-white/20 overflow-x-auto no-scrollbar">
        {tabs.map(({ key, label: l, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} className="flex items-center gap-2 px-2 pb-3 -mb-px text-sm font-extrabold whitespace-nowrap border-b-[3px] transition-colors"
            style={{ borderColor: tab === key ? "#fff" : "transparent", color: tab === key ? "#fff" : "rgba(255,255,255,.65)" }}>
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </nav>

      {/* ───────── GUSTOS ───────── */}
      {tab === "gustos" && (
        <div className="space-y-14">
          <section>
            <Head title="Tu mezcla de géneros" hint="Cada título reparte su peso entre sus géneros" />
            {genres.length === 0 ? <Empty text="Todavía no hay géneros suficientes." /> : <GenreBubbles genres={genres} />}
          </section>

          <section>
            <Head title="Películas vs series" hint="Según cantidad de títulos, no horas" />
            <div className="relative h-64 md:h-72" style={{ filter: fringe }}>
              <div className="absolute inset-0 overflow-hidden bg-[#0d0b16]" style={{ clipPath: `polygon(0 0, ${split + 7}% 0, ${split - 7}% 100%, 0 100%)`, borderRadius: "2rem 0 0 2rem" }}>
                <div className="absolute inset-0 flex gap-2 opacity-60">{movieP.map((p) => <img key={p.path} src={getPosterUrl(p.path, "w342")} alt="" className="h-full flex-1 min-w-0 object-cover" />)}</div>
                <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.85), rgba(8,7,14,.1))" }} />
                <div className="absolute left-7 md:left-10 bottom-6"><p className="font-cinema text-6xl md:text-8xl leading-none">{dna.formatDistribution.movie}%</p><p className={label}>Películas</p></div>
              </div>
              <div className="absolute inset-0 overflow-hidden bg-[#0d0b16]" style={{ clipPath: `polygon(${split + 7}% 0, 100% 0, 100% 100%, ${split - 7}% 100%)`, borderRadius: "0 2rem 2rem 0" }}>
                <div className="absolute inset-0 flex gap-2 opacity-60">{tvP.map((p) => <img key={p.path} src={getPosterUrl(p.path, "w342")} alt="" className="h-full flex-1 min-w-0 object-cover" />)}</div>
                <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, rgba(8,7,14,.85), rgba(8,7,14,.1))" }} />
                <div className="absolute right-7 md:right-10 bottom-6 text-right"><p className="font-cinema text-6xl md:text-8xl leading-none">{dna.formatDistribution.tv}%</p><p className={label}>Series</p></div>
              </div>
            </div>
          </section>

          {topRated.length > 0 && (
            <section>
              <Head title="Tus mejores puntuadas" hint="Las que más alto pusiste" />
              <div className="flex gap-7 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-1 px-1">
                {topRated.map((p, i) => (
                  <div key={p.path} className="relative shrink-0 pl-10 md:pl-14">
                    <span className="absolute left-0 bottom-10 font-cinema text-[7rem] md:text-[9rem] leading-none text-transparent select-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,.45)" }}>{i + 1}</span>
                    <div className="relative w-[150px] md:w-[190px]">
                      <div className="relative aspect-[2/3] rounded-[1.5rem] overflow-hidden border border-white/30 shadow-[0_24px_50px_-14px_rgba(0,0,0,.8)]">
                        <img src={getPosterUrl(p.path, "w342")} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                        {p.rating != null && <span className="liquid-glass-sm absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">★ {p.rating}</span>}
                      </div>
                      <p className="text-xs font-extrabold mt-2.5 line-clamp-2">{p.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Head title="Décadas" hint="De qué época son tus títulos" />
              {dna.decadeDistribution.length === 0 ? <Empty text="Todavía no hay suficiente información de años de estreno." /> : (
                <div className="flex items-end justify-between gap-3 min-h-[200px]">
                  {dna.decadeDistribution.map((d, i) => {
                    const size = 64 + (d.percentage / maxDecade) * 120;
                    return (
                      <div key={d.key} className="flex flex-col items-center gap-3 min-w-0">
                        <div className="liquid-glass rounded-full flex items-center justify-center text-[#0b0b14]" style={{ width: size, height: size, background: `radial-gradient(circle at 30% 25%, ${hueColor(i)}, ${hueColor(i)}88)` }}>
                          <span className="font-cinema leading-none" style={{ fontSize: size / 3.2 }}>{d.percentage}%</span>
                        </div>
                        <span className="text-xs font-extrabold text-white/80">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 lg:border-l lg:border-white/15 lg:pl-12">
              <Head title="Cómo puntuás" />
              {average != null ? (
                <div className="space-y-5">
                  <div className="flex items-end gap-4">
                    <p className="font-cinema text-8xl leading-none chroma">{average.toFixed(1)}</p>
                    <div className="pb-2">
                      {ratingLabel && <span className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-xs font-extrabold">{ratingLabel}</span>}
                      <p className="text-[11px] font-bold text-white/65 mt-2">mediana {median?.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 h-28">
                    {stars.map((s) => {
                      const n = distribution[String(s)] ?? 0;
                      return (
                        <div key={s} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                          <span className="text-[11px] font-extrabold text-white/70">{n}</span>
                          <div className="liquid-glass w-full rounded-xl" style={{ height: `${Math.max(6, (n / maxStar) * 100)}%`, background: "linear-gradient(180deg, rgba(255,255,255,.7), rgba(255,255,255,.2))" }} />
                          <span className="text-[11px] font-extrabold text-white/80">{s}★</span>
                        </div>
                      );
                    })}
                  </div>
                  {coverage < 0.6 && <p className="text-xs text-white/65">Puntuaste el {Math.round(coverage * 100)}% de tus títulos. A más puntuaciones, más precisa es esta sección.</p>}
                </div>
              ) : <Empty text="Todavía no puntuaste títulos. Puntuar te ayuda a afinar tu ADN." />}
            </div>

            {dna.runtimeProfile.averageMinutes != null && dna.runtimeProfile.label && (
              <div className="lg:col-span-3 lg:border-l lg:border-white/15 lg:pl-12">
                <Head title="Duración" hint="Promedio de tus películas" />
                <Clock className="w-5 h-5 text-white/60 mb-3" />
                <p className="font-cinema text-8xl leading-none chroma">{dna.runtimeProfile.averageMinutes}<span className="text-2xl ml-2 text-white/65">min</span></p>
                <p className="text-sm font-extrabold mt-3 text-white/85">{dna.runtimeProfile.label}</p>
              </div>
            )}
          </section>

          <section className="grid gap-12 lg:grid-cols-2">
            <div>
              <Head title="Países de origen" hint="Las coproducciones reparten su peso" />
              <Cloud items={dna.countryDistribution} empty="Todavía no hay suficiente información de países." />
            </div>
            <div className="lg:border-l lg:border-white/15 lg:pl-12">
              <Head title="Idiomas originales" />
              <Cloud items={dna.languageDistribution} empty="Todavía no hay suficiente información de idiomas." />
            </div>
          </section>

          {(dna.recurringDirectors.length > 0 || dna.recurringCast.length > 0) && (
            <section>
              <Head title="Creadores recurrentes" />
              <div className="grid gap-8 md:grid-cols-2">
                {[{ t: "Directores", l: dna.recurringDirectors }, { t: "Actores", l: dna.recurringCast }].filter((g) => g.l.length > 0).map((g) => (
                  <div key={g.t}>
                    <p className={`${label} mb-3`}>{g.t}</p>
                    <div className="flex flex-wrap gap-2">
                      {g.l.map((c) => <span key={c.name} className="frost-card inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold">{c.name} <span className="text-xs font-extrabold text-white/60">×{c.count}</span></span>)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ───────── CÓMO MIRÁS ───────── */}
      {tab === "habitos" && (
        <div className="space-y-14">
          {phrase && (
            <section className="relative overflow-hidden rounded-[2.5rem] border border-white/20 min-h-[280px] flex flex-col justify-end p-7 md:p-12"
              style={{ boxShadow: "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4), 0 30px 80px -20px rgba(0,0,0,.6)", background: posters.length ? undefined : "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))" }}>
              <PosterWall posters={posters} />
              <p className="relative font-cinema text-4xl md:text-6xl leading-[1.05] text-pretty max-w-5xl">{phrase.text}</p>
              <p className="relative text-xs font-bold text-white/65 mt-4">{phrase.disclaimer}</p>
            </section>
          )}
          {!hasHabits ? (
            <section>
              <Head title="Cómo mirás" />
              <Empty text="Todavía no hay sesiones registradas. En la ficha de cada título podés anotar dónde, cuándo y con quién lo viste, y esta sección se completa sola." />
            </section>
          ) : (
            <>
              <section className="grid gap-12 lg:grid-cols-12">
                <HabitBlock className="lg:col-span-7" title="Dónde lo ves" items={dna.venueDistribution} empty="Sin datos de lugar todavía." sessions={cov.venue?.sessions}><StackBar items={dna.venueDistribution} /></HabitBlock>
                <HabitBlock className="lg:col-span-5 lg:border-l lg:border-white/15 lg:pl-12" title="Cuándo lo ves" items={dna.timeDistribution} empty="Sin datos de horario todavía." sessions={cov.time?.sessions}><Pillars items={dna.timeDistribution} /></HabitBlock>
              </section>
              <section className="grid gap-12 lg:grid-cols-12">
                <HabitBlock className="lg:col-span-5" title="Con quién" items={dna.companionshipDistribution} empty="Sin datos de compañía todavía." sessions={cov.companionship?.sessions}><Dots items={dna.companionshipDistribution} /></HabitBlock>
                <HabitBlock className="lg:col-span-4 lg:border-l lg:border-white/15 lg:pl-12" title="Idioma en que lo ves" items={dna.languageModeDistribution} empty="Sin datos de idioma todavía." sessions={cov.language?.sessions}><StackBar items={dna.languageModeDistribution} /></HabitBlock>
                <HabitBlock className="lg:col-span-3 lg:border-l lg:border-white/15 lg:pl-12" title="Cómo lo ves" items={dna.platformDistribution} empty="Sin datos de plataforma todavía." sessions={cov.platform?.sessions}><RankList items={dna.platformDistribution} /></HabitBlock>
              </section>
              <section>
                <Head title="Re-ver" hint="Cuánto volvés a lo que ya viste" />
                <div className="flex flex-wrap items-center gap-10">
                  <Ring pct={rewatchPct} size={190} stroke={16}><span className="font-cinema text-5xl leading-none"><CountUp value={rewatchPct} suffix="%" /></span></Ring>
                  <div className="grid grid-cols-3 gap-8">
                    {[{ n: dna.rewatchProfile.rewatchSessions, l: "re-vistas" }, { n: dna.rewatchProfile.uniqueTitles, l: "títulos únicos" }, { n: dna.rewatchProfile.totalSessions, l: "sesiones" }].map(({ n, l }) => (
                      <div key={l}><p className="font-cinema text-5xl leading-none">{n}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/65 mt-2">{l}</p></div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
          {dna.reactionDistribution.length > 0 && (
            <section>
              <Head title="Qué te dejan" hint="Reacciones que más elegís" />
              <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
                {dna.reactionDistribution.map((r, i) => (
                  <span key={r.key} className="font-cinema leading-none inline-flex items-baseline gap-2" style={{ fontSize: `${1.6 + Math.min(r.percentage, 50) / 16}rem` }}>
                    <span className="w-2.5 h-2.5 rounded-full self-center" style={{ background: hueColor(i) }} />{r.label}
                    <span className="font-sans text-xs font-extrabold text-white/60">{r.percentage}%</span>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ───────── PERFIL Y CONFIANZA ───────── */}
      {tab === "perfil" && (
        <div className="space-y-14">
          <section className="flex flex-wrap items-center gap-10">
            <Ring pct={dna.confidenceScore} size={230} stroke={18}>
              <span className="font-cinema text-7xl leading-none"><CountUp value={dna.confidenceScore} /></span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/65 mt-1">de 100</span>
            </Ring>
            <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
              <Head title="Confianza del ADN" hint={cls.hint} />
              <div className="grid grid-cols-3 gap-6 max-w-xl">
                {[{ n: dna.validTitleCount, l: "títulos válidos" }, { n: dna.ratedTitleCount, l: "puntuados" }].map(({ n, l }) => (
                  <div key={l}><p className="font-cinema text-5xl leading-none">{n}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/65 mt-2">{l}</p></div>
                ))}
                <div><p className="font-cinema text-3xl leading-tight">{cls.label}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/65 mt-2">estado</p></div>
              </div>
            </div>
          </section>

          <section>
            <Head title="Tu perfil de espectador" hint="Etiquetas calculadas con reglas, sin IA" />
            {dna.contextTags.length === 0 ? <Empty text="Todavía no hay suficientes sesiones para inferir un perfil." /> : (
              <div>
                {dna.contextTags.map((t) => <TagRow key={t.slug} title={t.label} pct={Math.round(t.score <= 1 ? t.score * 100 : t.score)} text={t.explanation} />)}
              </div>
            )}
          </section>

          {Object.keys(cov).length > 0 && (
            <section>
              <Head title="Cobertura del contexto" hint="Cuántas sesiones respaldan cada dato" />
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-y-8 [&>div]:px-6 [&>div:first-child]:pl-0 [&>div+div]:md:border-l [&>div+div]:border-white/15">
                {Object.entries(cov).map(([k, c]) => (
                  <div key={k}>
                    <p className="font-cinema text-5xl leading-none">{c.sessions}</p>
                    <p className="text-sm font-extrabold mt-2">{c.label}</p>
                    <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60 mt-1">{c.level}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
