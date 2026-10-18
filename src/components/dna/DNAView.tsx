
import "@/styles/cinema.css";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sparkles, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { UserDNA, WeightedMetric } from "@/types";
import { classifyDna } from "@/lib/dnaStatus";
import { buildWatchingHabitsPhrase } from "@/lib/dnaPhrase";
import type { RGB } from "@/lib/posterColor";
import { getPosterUrl } from "@/services/tmdb";

export interface DnaPoster { path: string; title: string; rating: number | null; type: string; genreIds?: number[]; year?: number | null; countries?: string[]; lang?: string; runtime?: number | null }

/* ───────── utilidades ───────── */

const edge = "inset 2px 0 0 rgba(255,80,140,.32), inset -2px 0 0 rgba(70,170,255,.32)";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const sortRated = (l: DnaPoster[]) => [...l].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }); } catch { return iso; }
}

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = Math.round(h * 60);
  return [h < 0 ? h + 360 : h, s, l];
}

/**
 * Color protagonista de un póster: el tono más presente entre los píxeles saturados
 * (el promedio simple da grises). Devuelve null si no se pudo leer o es blanco y negro.
 */
function vividColor(src: string): Promise<RGB | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 40;
        const cv = document.createElement("canvas");
        cv.width = size; cv.height = size;
        const ctx = cv.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, size, size);
        const d = ctx.getImageData(0, 0, size, size).data;
        const B = 24, w = new Array(B).fill(0), acc = Array.from({ length: B }, () => [0, 0, 0, 0]);
        for (let i = 0; i < d.length; i += 4) {
          const c = { r: d[i], g: d[i + 1], b: d[i + 2] };
          const [h, s, l] = rgbToHsl(c);
          if (s < 0.25 || l < 0.12 || l > 0.9) continue;
          const k = Math.floor(h / (360 / B)) % B, wt = s * (1 - Math.abs(l - 0.5));
          w[k] += wt; acc[k][0] += c.r * wt; acc[k][1] += c.g * wt; acc[k][2] += c.b * wt; acc[k][3] += wt;
        }
        let best = -1, bw = 0;
        w.forEach((v, k) => { if (v > bw) { bw = v; best = k; } });
        if (best < 0 || bw < 0.4) return resolve(null);
        const a = acc[best];
        resolve({ r: Math.round(a[0] / a[3]), g: Math.round(a[1] / a[3]), b: Math.round(a[2] / a[3]) });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Color CSS vivo a partir del tono del póster. Sin póster o en blanco y negro: blanco suave, nunca un color inventado. */
function tintCss(c: RGB | null, a = 1): string {
  if (!c) return `hsl(0 0% 85% / ${a * 0.45})`;
  const [h, s] = rgbToHsl(c);
  return `hsl(${h} ${Math.round(Math.min(70, Math.max(42, s * 80)))}% 62% / ${a})`;
}

const tintCache = new Map<string, RGB | null>();
function usePosterTint(path?: string | null): RGB | null {
  const [t, setT] = useState<RGB | null>(path ? tintCache.get(path) ?? null : null);
  useEffect(() => {
    if (!path) { setT(null); return; }
    if (tintCache.has(path)) { setT(tintCache.get(path) ?? null); return; }
    let off = false;
    vividColor(getPosterUrl(path, "w200")).then((c) => { tintCache.set(path, c); if (!off) setT(c); });
    return () => { off = true; };
  }, [path]);
  return t;
}

const BathTint = createContext<RGB | null>(null);

function useReady() {
  const [r, setR] = useState(false);
  useEffect(() => { const t = setTimeout(() => setR(true), 80); return () => clearTimeout(t); }, []);
  return r;
}

function useCycle(len: number, offset = 0, ms = 4200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (len < 2) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const s = setTimeout(() => { t = setInterval(() => setI((v) => v + 1), ms); }, offset);
    return () => { clearTimeout(s); if (t) clearInterval(t); };
  }, [len, offset, ms]);
  return len ? i % len : 0;
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

/* ───────── piezas visuales ───────── */

function Chroma({ p, size = "w200", rounded = "rounded-xl", spread = 5, className = "" }: { p: DnaPoster; size?: "w200" | "w342"; rounded?: string; spread?: number; className?: string }) {
  const src = getPosterUrl(p.path, size);
  return (
    <div className={`relative ${className}`}>
      {[-1, 1].map((d) => (
        <img key={d} src={src} alt="" aria-hidden="true" loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${rounded} opacity-60`}
          style={{ transform: `translate(${d * spread}px, ${-d * 2}px)`, mixBlendMode: "screen", filter: d < 0 ? "sepia(1) saturate(6) hue-rotate(-50deg)" : "sepia(1) saturate(6) hue-rotate(150deg)" }} />
      ))}
      <img src={src} alt={p.title} loading="lazy" className={`relative w-full h-full object-cover ${rounded} border border-white/30 shadow-[0_16px_32px_-10px_rgba(0,0,0,.8)]`} />
    </div>
  );
}

function FringedCover({ src, className = "" }: { src: string; className?: string }) {
  return (
    <>
      {[-1, 1].map((d) => (
        <img key={d} src={src} alt="" aria-hidden="true" loading="lazy" className={`absolute inset-0 w-full h-full object-cover opacity-50 ${className}`}
          style={{ transform: `translateX(${d * 6}px)`, mixBlendMode: "screen", filter: d < 0 ? "sepia(1) saturate(6) hue-rotate(-50deg)" : "sepia(1) saturate(6) hue-rotate(150deg)" }} />
      ))}
      <img src={src} alt="" loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${className}`} />
    </>
  );
}

/** Marcas de película: cuántas están encendidas indica el porcentaje; el tamaño nunca cambia. */
function Ticks({ pct, max = 100, tint, n = 20 }: { pct: number; max?: number; tint?: RGB | null; n?: number }) {
  const ready = useReady();
  const ctx = useContext(BathTint);
  const t = tint === undefined ? ctx : tint;
  const lit = Math.max(1, Math.round((pct / Math.max(1, max)) * n));
  return (
    <div className="flex gap-[3px] h-2" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="flex-1 rounded-[2px] transition-all duration-700" style={{ transitionDelay: `${i * 20}ms`, background: ready && i < lit ? tintCss(t, 1) : "rgba(255,255,255,.16)", boxShadow: ready && i < lit ? `0 0 6px ${tintCss(t, 0.3)}` : undefined }} />
      ))}
    </div>
  );
}

function BathLayer({ poster, active, strength }: { poster: DnaPoster; active: boolean; strength: number }) {
  const tint = usePosterTint(poster.path);
  return (
    <div className="absolute inset-0 transition-opacity duration-[1800ms] ease-in-out" style={{ opacity: active ? 1 : 0 }}>
      <img src={getPosterUrl(poster.path, "w342")} alt="" className="absolute inset-0 w-full h-full object-cover scale-125" style={{ opacity: 0.2 * strength, filter: "blur(55px) saturate(1.3)" }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(75% 95% at 10% 15%, ${tintCss(tint, 0.26 * strength)}, transparent 70%), radial-gradient(65% 85% at 95% 95%, ${tintCss(tint, 0.18 * strength)}, transparent 70%)` }} />
    </div>
  );
}

/** Baño de color: los pósters rotan detrás del contenido y su color tiñe fondo, marcas y brillos. Sin bordes ni caja. */
function Bath({ posters = [], children, className = "", strength = 1, offset = 0 }: { posters?: DnaPoster[]; children: ReactNode; className?: string; strength?: number; offset?: number }) {
  const cur = useCycle(posters.length, offset, 6500);
  const tint = usePosterTint(posters[cur]?.path);
  const m = "linear-gradient(180deg, transparent, #000 22%, #000 78%, transparent)";
  return (
    <BathTint.Provider value={tint}>
      <div className={`relative ${className}`}>
        <div aria-hidden="true" className="absolute inset-x-0 md:-inset-x-6 -inset-y-10 pointer-events-none overflow-hidden" style={{ WebkitMaskImage: m, maskImage: m }}>
          {posters.map((p, k) => <BathLayer key={p.path} poster={p} active={k === cur} strength={strength} />)}
        </div>
        <div className="relative">{children}</div>
      </div>
    </BathTint.Provider>
  );
}

function Opener({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div id={id} className="flex items-end gap-3 md:gap-8 min-w-0">
      <span className="font-cinema text-[4.5rem] md:text-[9rem] leading-[.8] select-none shrink-0" style={{ WebkitTextStroke: "2px rgba(255,255,255,.5)", color: "transparent" }}>{n}</span>
      <h2 className="font-cinema text-4xl md:text-7xl leading-[.9] pb-1 min-w-0 [overflow-wrap:anywhere]">{title}</h2>
    </div>
  );
}

function Sec({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-cinema text-3xl md:text-4xl leading-none">{title}</h3>
      {hint && <p className="text-xs font-bold text-white/65 mt-2">{hint}</p>}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-white/65 leading-relaxed">{text}</p>;
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
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.9) 0%, rgba(8,7,14,.6) 40%, rgba(8,7,14,.2) 100%), linear-gradient(180deg, rgba(8,7,14,.2), rgba(8,7,14,.6))" }} />
    </div>
  );
}

function Ring({ pct, size = 160, stroke = 12, children }: { pct: number; size?: number; stroke?: number; children?: ReactNode }) {
  const ready = useReady();
  const tint = useContext(BathTint);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tintCss(tint, 1)} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          strokeDashoffset={ready ? c * (1 - Math.min(100, pct) / 100) : c} style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(.2,.8,.2,1), stroke 1.6s", filter: "drop-shadow(-1px 0 1px rgba(255,60,120,.5)) drop-shadow(1px 0 1px rgba(60,200,255,.5))" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ───────── gustos ───────── */

const LABEL_IDS: [string, number[]][] = [
  ["drama", [18]], ["comedia", [35]], ["animacion", [16]], ["thriller", [53]], ["suspenso", [53]], ["crimen", [80]], ["terror", [27]],
  ["ciencia ficcion", [878, 10765]], ["sci", [878, 10765]], ["fantasia", [14, 10765]], ["accion", [28, 10759]], ["aventura", [12, 10759]], ["romance", [10749]],
  ["misterio", [9648]], ["documental", [99]], ["familia", [10751]], ["musica", [10402]], ["historia", [36]], ["belica", [10752, 10768]], ["guerra", [10752, 10768]],
  ["western", [37]], ["tv", [10770]], ["infantil", [10762]],
];
const idsFor = (label: string): number[] => { const n = norm(label); return LABEL_IDS.find(([k]) => n.includes(k))?.[1] ?? []; };
const regionName = (code: string) => { try { return new Intl.DisplayNames(["es"], { type: "region" }).of(code) ?? code; } catch { return code; } };
const langName = (code: string) => { try { return new Intl.DisplayNames(["es"], { type: "language" }).of(code) ?? code; } catch { return code; } };
const sameName = (a: string, b: string) => { const x = norm(a), y = norm(b); return x === y || x.includes(y) || y.includes(x); };

/** Tarjeta-foto: la imagen rota entre títulos tuyos y el color de cada póster baña borde, brillo y fondo. */
function PhotoTile({ posters, label, pct, max, offset, note }: { posters: DnaPoster[]; label: string; pct: number; max: number; offset: number; note?: string }) {
  const cur = useCycle(posters.length, offset);
  const tint = usePosterTint(posters[cur]?.path);
  const T = 1400;
  return (
    <div className="group relative overflow-hidden rounded-[1.8rem] aspect-[3/4]" style={{ boxShadow: `${edge}, 0 28px 60px -24px ${tintCss(tint, 0.42)}`, transition: `box-shadow ${T}ms`, background: "#0c0a18" }}>
      {posters.map((p, k) => (
        <div key={p.path} className="absolute inset-0 transition-opacity ease-in-out" style={{ opacity: k === cur ? 1 : 0, transitionDuration: `${T}ms` }}>
          <FringedCover src={getPosterUrl(p.path, "w342")} className="transition-transform duration-[1600ms] group-hover:scale-105" />
        </div>
      ))}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(0deg, rgba(8,7,14,.92) 0%, rgba(8,7,14,.25) 48%, transparent 70%), radial-gradient(120% 70% at 0% 100%, ${tintCss(tint, 0.34)}, transparent 70%), radial-gradient(90% 60% at 100% 0%, ${tintCss(tint, 0.2)}, transparent 70%)` }} />
      <div className="relative h-full flex flex-col justify-end gap-2 p-4 md:p-5">
        {posters[cur] && <p key={cur} className="text-[11px] font-bold text-white/80 truncate animate-fade-in">{posters[cur].title}</p>}
        <p className="font-cinema text-3xl md:text-4xl leading-none">{label}</p>
        {note && <p className="text-[11px] font-bold text-white/70 line-clamp-2">{note}</p>}
        <span className="font-cinema text-5xl md:text-6xl leading-none"><CountUp value={pct} suffix="%" /></span>
        <Ticks pct={pct} max={max} tint={tint} />
      </div>
    </div>
  );
}

function GenreMosaic({ genres, others, posters }: { genres: WeightedMetric[]; others: WeightedMetric[]; posters: DnaPoster[] }) {
  const sum = genres.reduce((a, g) => a + g.percentage, 0);
  const rest = Math.max(0, Math.round(100 - sum));
  const showRest = rest >= 1 || others.length > 0;
  const max = Math.max(1, ...genres.map((g) => g.percentage), showRest ? rest : 0);
  const { lists, restList } = useMemo(() => {
    const used = new Set<string>();
    const all = new Set<number>();
    const lists = genres.map((g) => {
      const ids = idsFor(g.label);
      ids.forEach((x) => all.add(x));
      const own = sortRated(posters.filter((p) => p.genreIds?.some((x) => ids.includes(x))));
      const pick = [...own.filter((p) => !used.has(p.path)), ...own.filter((p) => used.has(p.path))].slice(0, 5);
      pick.slice(0, 2).forEach((p) => used.add(p.path));
      return pick;
    });
    const restList = sortRated(posters.filter((p) => p.genreIds?.length && !p.genreIds.some((x) => all.has(x)))).slice(0, 5);
    return { lists, restList: restList.length ? restList : sortRated(posters).slice(6, 11) };
  }, [genres, posters]);
  return (
    <div className="grid gap-3 md:gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))" }}>
      {genres.map((g, i) => <PhotoTile key={g.key} posters={lists[i]} label={g.label} pct={g.percentage} max={max} offset={i * 650} />)}
      {showRest && <PhotoTile posters={restList} label="Otros géneros" pct={rest} max={max} offset={genres.length * 650} note={others.slice(0, 6).map((o) => o.label).join(" · ") || undefined} />}
    </div>
  );
}

function FormatPanel({ label, pct, ps, k, lead }: { label: string; pct: number; ps: DnaPoster[]; k: number; lead: boolean }) {
  const cur = useCycle(ps.length > 4 ? ps.length : 0, k * 900, 5000);
  const shown = ps.length > 4 ? [0, 1, 2, 3].map((o) => ps[(cur + o) % ps.length]) : ps.slice(0, 4);
  const tint = usePosterTint(shown[0]?.path);
  return (
    <div className="relative overflow-hidden rounded-[2rem] h-60 md:h-72 flex items-end" style={{ boxShadow: `${edge}, 0 28px 60px -24px ${tintCss(tint, 0.42)}`, transition: "box-shadow 1400ms" }}>
      <div className="absolute inset-0 flex gap-1" style={{ filter: lead ? undefined : "saturate(.45) brightness(.75)" }}>
        {shown.map((x) => <div key={x.path} className="relative flex-1 min-w-0"><FringedCover src={getPosterUrl(x.path, "w342")} /></div>)}
      </div>
      <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(0deg, rgba(8,7,14,.9), transparent 62%), radial-gradient(100% 80% at ${k ? "100%" : "0%"} 100%, ${tintCss(tint, 0.3)}, transparent 70%)` }} />
      <div className={`relative p-6 md:p-8 w-full ${k ? "text-right" : ""}`}>
        <p className="font-cinema text-6xl md:text-8xl leading-none"><CountUp value={pct} suffix="%" /></p>
        <p className="text-xs font-extrabold uppercase tracking-[.25em] text-white/80 mt-2">{label}</p>
      </div>
    </div>
  );
}

function FormatSplit({ movie, tv, movieP, tvP }: { movie: number; tv: number; movieP: DnaPoster[]; tvP: DnaPoster[] }) {
  const lead = movie >= tv ? 0 : 1;
  return (
    <div className="grid md:grid-cols-2 gap-3 md:gap-4">
      <FormatPanel label="Películas" pct={movie} ps={movieP} k={0} lead={lead === 0} />
      <FormatPanel label="Series" pct={tv} ps={tvP} k={1} lead={lead === 1} />
    </div>
  );
}

function TopRated({ posters }: { posters: DnaPoster[] }) {
  const list = sortRated(posters.filter((p) => p.rating != null)).slice(0, 12);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ l: false, r: false });
  const update = () => { const el = ref.current; if (el) setPos({ l: el.scrollLeft > 8, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 }); };
  useEffect(() => { update(); const el = ref.current; if (!el) return; const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect(); }, [list.length]);
  if (list.length === 0) return null;
  const by = (d: number) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  const arrow = "absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full hidden md:flex items-center justify-center bg-black/55 backdrop-blur-md border border-white/25 hover:scale-110 transition-transform";
  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className="flex gap-8 overflow-x-auto no-scrollbar pb-4 pt-2 -mx-1 px-1 snap-x">
        {list.map((p, i) => (
          <div key={p.path} className="relative shrink-0 snap-start pl-12 md:pl-16">
            <span className="absolute left-0 bottom-12 font-cinema text-[8rem] md:text-[10rem] leading-none select-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,.4)", color: "transparent" }}>{i + 1}</span>
            <div className="relative w-[160px] md:w-[210px]">
              <Chroma p={p} size="w342" rounded="rounded-[1.5rem]" spread={7} className="aspect-[2/3]" />
              {p.rating != null && <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-black/50 backdrop-blur-md border border-white/25">★ {p.rating}</span>}
              <p className="text-xs font-extrabold mt-3 line-clamp-2">{p.title}</p>
            </div>
          </div>
        ))}
      </div>
      {pos.l && <button type="button" aria-label="Ver anteriores" onClick={() => by(-1)} className={`${arrow} left-0`}><ChevronLeft className="w-5 h-5" /></button>}
      {pos.r && <button type="button" aria-label="Ver más" onClick={() => by(1)} className={`${arrow} right-0`}><ChevronRight className="w-5 h-5" /></button>}
    </div>
  );
}

function DecadeCol({ d, ps, max }: { d: WeightedMetric; ps: DnaPoster[]; max: number }) {
  const cur = useCycle(ps.length > 3 ? ps.length : 0, 0, 5000);
  const shown = ps.length > 3 ? [0, 1, 2].map((o) => ps[(cur + o) % ps.length]) : ps;
  const tint = usePosterTint(shown[0]?.path);
  const title = /^\d{4}$/.test(d.label) ? `${d.label}s` : d.label;
  const m = "radial-gradient(closest-side, #000 30%, transparent)";
  return (
    <div className="group relative flex flex-col items-center text-center">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[78%] pointer-events-none transition-[background] duration-[1400ms]" style={{ background: tintCss(tint, 0.26), WebkitMaskImage: m, maskImage: m }} />
      <div className="relative h-60 md:h-72 w-full">
        {shown.length === 0 ? <div className="absolute inset-x-10 inset-y-2 rounded-3xl border border-dashed border-white/25" /> : shown.map((p, k) => {
          const o = k - (shown.length - 1) / 2;
          return (
            <div key={p.path} className="absolute bottom-0 left-1/2 h-[92%] aspect-[2/3] transition-transform duration-500 group-hover:scale-105" style={{ transform: `translateX(-50%) translateX(${o * 64}px) rotate(${o * 9}deg)`, zIndex: 10 - Math.round(Math.abs(o) * 2), transformOrigin: "50% 100%" }}>
              <Chroma p={p} size="w342" rounded="rounded-2xl" spread={6} className="w-full h-full" />
            </div>
          );
        })}
      </div>
      <p className="relative font-cinema text-5xl leading-none mt-5" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,.85)", color: "transparent" }}>{title}</p>
      <p className="relative font-cinema text-4xl leading-none mt-2">{d.percentage}%</p>
      <div className="relative mt-3 w-full max-w-[230px]"><Ticks pct={d.percentage} max={max} tint={tint} n={14} /></div>
    </div>
  );
}

function DecadeRow({ items, posters }: { items: WeightedMetric[]; posters: DnaPoster[] }) {
  const list = [...items].sort((a, b) => (parseInt(a.label) || 0) - (parseInt(b.label) || 0));
  const max = Math.max(1, ...list.map((d) => d.percentage));
  return (
    <div className="grid gap-x-6 gap-y-12" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))" }}>
      {list.map((d) => {
        const y = parseInt(d.label);
        const ps = sortRated(posters.filter((p) => p.year != null && !Number.isNaN(y) && p.year >= y && p.year < y + 10)).slice(0, 6);
        return <DecadeCol key={d.key} d={d} ps={ps} max={max} />;
      })}
    </div>
  );
}

/** Cómo puntuás: promedio grande y un póster por nota (todos del mismo tamaño). */
function RatingBlock({ average, median, label, distribution, coverage, posters }: { average: number; median: number | null; label?: string | null; distribution: Record<string, number>; coverage: number; posters: DnaPoster[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3 mb-7">
        <p className="font-cinema text-7xl md:text-9xl leading-[.85]">{average.toFixed(1)}</p>
        <div className="pb-2">
          <div className="relative inline-block text-3xl leading-none tracking-wider" aria-label={`${average.toFixed(1)} de 5`}>
            <span className="text-white/20">★★★★★</span>
            <span className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-white" style={{ width: `${(average / 5) * 100}%` }}>★★★★★</span>
          </div>
          <p className="text-sm font-extrabold mt-3">{label}{median != null && <span className="text-white/65 font-bold"> · mediana {median.toFixed(1)}</span>}</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2.5 md:gap-3">
        {[1, 2, 3, 4, 5].map((s) => {
          const n = distribution[String(s)] ?? 0;
          const p = sortRated(posters.filter((x) => x.rating != null && Math.round(x.rating) === s))[0];
          return (
            <div key={s} className="relative aspect-[2/3] rounded-2xl overflow-hidden" style={{ boxShadow: n ? edge : "inset 0 0 0 1px rgba(255,255,255,.18)", opacity: n ? 1 : 0.5 }}>
              {p ? <FringedCover src={getPosterUrl(p.path, "w200")} /> : <div className="absolute inset-0 border border-dashed border-white/20 rounded-2xl" />}
              <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(8,7,14,.9), transparent 55%)" }} />
              <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                <p className="font-cinema text-2xl md:text-3xl leading-none">{s}★</p>
                <p className="text-[10px] font-extrabold text-white/80 mt-0.5">{n}</p>
              </div>
            </div>
          );
        })}
      </div>
      {coverage < 0.6 && <p className="text-xs text-white/65 mt-4">Puntuaste el {Math.round(coverage * 100)}% de tus títulos. A más puntuaciones, más precisa es esta sección.</p>}
    </div>
  );
}

function RuntimeBlock({ minutes, label, posters }: { minutes: number; label: string; posters: DnaPoster[] }) {
  const ready = useReady();
  const withRt = posters.filter((p) => p.type === "movie" && p.runtime && p.runtime > 20).sort((a, b) => (a.runtime ?? 0) - (b.runtime ?? 0));
  const short = withRt[0], long = withRt.length > 1 ? withRt[withRt.length - 1] : undefined;
  const lo = Math.min(short?.runtime ?? minutes, minutes) - 10, hi = Math.max(long?.runtime ?? minutes, minutes) + 10;
  const pos = Math.min(100, Math.max(0, ((minutes - lo) / (hi - lo)) * 100));
  return (
    <div>
      <div className="flex items-end gap-4 mb-7">
        <Clock className="w-6 h-6 text-white/70 mb-3" />
        <p className="font-cinema text-7xl md:text-9xl leading-[.85]">{minutes}<span className="text-3xl ml-3 text-white/70">min</span></p>
      </div>
      <p className="text-sm font-extrabold mb-6">{label}</p>
      <div className="relative h-3 rounded-full" style={{ background: "linear-gradient(90deg, #ff5a8c, #fff 50%, #5aaaff)", boxShadow: "0 0 30px rgba(255,255,255,.25)" }}>
        <span className="absolute top-1/2 w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-4 border-[#0b0b14] transition-all duration-1000 ease-out" style={{ left: ready ? `${pos}%` : "0%", boxShadow: "-3px 0 0 rgba(255,60,130,.9), 3px 0 0 rgba(60,200,255,.9)" }} />
      </div>
      <div className="flex justify-between items-end gap-4 mt-6">
        {[short, long].map((p, k) => p ? (
          <div key={p.path} className={`flex items-center gap-3 min-w-0 ${k ? "flex-row-reverse text-right" : ""}`}>
            <Chroma p={p} size="w200" className="w-16 aspect-[2/3] shrink-0" rounded="rounded-xl" spread={4} />
            <div className="min-w-0"><p className="font-cinema text-3xl leading-none">{p.runtime} min</p><p className="text-[11px] font-bold text-white/75 mt-1 truncate">{k ? "La más larga" : "La más corta"} · {p.title}</p></div>
          </div>
        ) : <span key={k} />)}
      </div>
    </div>
  );
}

/** Ranking: foto del primero y lista compacta con miniaturas para el resto. */
function RankList({ items, pick, empty }: { items: WeightedMetric[]; pick: (label: string) => DnaPoster[]; empty: string }) {
  if (items.length === 0) return <Empty text={empty} />;
  const max = Math.max(1, ...items.map((i) => i.percentage));
  const [first, ...rest] = items.slice(0, 7);
  const ps = sortRated(pick(first.label)).slice(0, 4);
  return (
    <div>
      <RankHero label={first.label} pct={first.percentage} max={max} ps={ps} />
      {rest.length > 0 && (
        <ul className="mt-2 divide-y divide-white/10">
          {rest.map((it) => <RankRow key={it.key} it={it} max={max} ps={sortRated(pick(it.label)).slice(0, 2)} />)}
        </ul>
      )}
    </div>
  );
}

function RankHero({ label, pct, max, ps }: { label: string; pct: number; max: number; ps: DnaPoster[] }) {
  const cur = useCycle(ps.length, 0, 5200);
  const tint = usePosterTint(ps[cur]?.path);
  return (
    <div className="group relative overflow-hidden rounded-[1.8rem] aspect-[16/8] min-h-[200px]" style={{ boxShadow: `${edge}, 0 28px 60px -24px ${tintCss(tint, 0.42)}`, transition: "box-shadow 1400ms", background: "#0c0a18" }}>
      <div className="absolute inset-0 flex gap-[3px]">
        {ps.map((p, k) => (
          <div key={p.path} className="relative min-w-0 overflow-hidden transition-[flex] duration-[1400ms] ease-in-out" style={{ flex: k === cur ? 2.4 : 1 }}>
            <FringedCover src={getPosterUrl(p.path, "w342")} className="transition-transform duration-[1600ms] group-hover:scale-105" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(0deg, rgba(8,7,14,.94) 0%, rgba(8,7,14,.2) 60%, transparent 80%), radial-gradient(120% 80% at 0% 100%, ${tintCss(tint, 0.34)}, transparent 70%)` }} />
      <div className="relative h-full flex flex-col justify-end gap-2 p-5">
        <div className="flex items-end justify-between gap-4">
          <p className="font-cinema text-4xl md:text-5xl leading-[.95] break-words">{label}</p>
          <span className="font-cinema text-5xl md:text-6xl leading-none">{pct}%</span>
        </div>
        <Ticks pct={pct} max={max} tint={tint} n={28} />
      </div>
    </div>
  );
}

function RankRow({ it, max, ps }: { it: WeightedMetric; max: number; ps: DnaPoster[] }) {
  const tint = usePosterTint(ps[0]?.path);
  return (
    <li className="flex items-center gap-4 py-3">
      <div className="relative shrink-0 h-14 w-[60px]">
        {ps.length === 0 ? <div className="absolute inset-0 rounded-lg border border-dashed border-white/25" /> : ps.map((p, k) => (
          <div key={p.path} className="absolute top-0 h-full aspect-[2/3]" style={{ left: k * 18, zIndex: 5 - k }}><Chroma p={p} spread={2} className="w-full h-full" rounded="rounded-lg" /></div>
        ))}
      </div>
      <span className="font-cinema text-xl md:text-3xl leading-none w-24 md:w-44 truncate">{it.label}</span>
      <div className="flex-1 min-w-0"><Ticks pct={it.percentage} max={max} tint={tint} n={14} /></div>
      <span className="font-cinema text-2xl md:text-3xl leading-none w-16 text-right text-white/85">{it.percentage}%</span>
    </li>
  );
}

function NameList({ title, list }: { title: string; list: { name: string; count: number }[] }) {
  const max = Math.max(1, ...list.map((c) => c.count));
  return (
    <div>
      <Sec title={title} />
      <ul className="divide-y divide-white/10">
        {list.slice(0, 7).map((c) => (
          <li key={c.name} className="flex items-center gap-4 py-3">
            <span className="font-cinema text-2xl md:text-3xl leading-none flex-1 min-w-0 truncate">{c.name}</span>
            <div className="w-24 md:w-32"><Ticks pct={c.count} max={max} n={10} /></div>
            <span className="font-cinema text-2xl leading-none w-10 text-right text-white/85">×{c.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────── cómo mirás ───────── */

function FaderList({ items }: { items: WeightedMetric[] }) {
  const max = Math.max(1, ...items.map((i) => i.percentage));
  return (
    <ul className="divide-y divide-white/10">
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-4 py-3">
          <span className="font-cinema text-xl md:text-3xl leading-none w-28 md:w-48 truncate">{it.label}</span>
          <div className="flex-1 min-w-0"><Ticks pct={it.percentage} max={max} n={16} /></div>
          <span className="font-cinema text-2xl md:text-3xl leading-none w-16 text-right text-white/85">{it.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

function HabitBlock({ title, sessions, items, empty, posters, offset }: { title: string; sessions?: number; items: WeightedMetric[]; empty: string; posters: DnaPoster[]; offset: number }) {
  return (
    <Bath posters={posters} offset={offset} strength={0.9}>
      <Sec title={title} hint={sessions ? `${sessions} ${sessions === 1 ? "sesión" : "sesiones"}` : undefined} />
      {items.length === 0 ? <Empty text={empty} /> : <FaderList items={items} />}
    </Bath>
  );
}

function TagRow({ title, pct, text, poster }: { title: string; pct: number; text: string; poster?: DnaPoster }) {
  return (
    <div className="flex gap-5 py-6 border-t border-white/15">
      {poster && <Chroma p={poster} className="w-16 md:w-20 aspect-[2/3] shrink-0 self-start" rounded="rounded-xl" spread={4} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-cinema text-3xl md:text-4xl leading-none">{title}</p>
          <p className="font-cinema text-3xl md:text-4xl leading-none text-white/85">{pct}%</p>
        </div>
        <div className="mt-3"><Ticks pct={pct} n={22} /></div>
        <p className="text-sm leading-relaxed text-white/80 mt-3">{text}</p>
      </div>
    </div>
  );
}

/* ───────── vista principal ───────── */

export default function DNAView({ dna, title = "Mi ADN", owner, actions, posters = [] }: {
  dna: UserDNA; title?: string; owner?: string; actions?: ReactNode; posters?: DnaPoster[];
}) {
  const cls = classifyDna(dna.status);
  const phrase = buildWatchingHabitsPhrase(dna);
  const { average, median, distribution, label: ratingLabel, coverage } = dna.ratingProfile;
  const cov = dna.contextCoverage;
  const hasHabits = [dna.venueDistribution, dna.timeDistribution, dna.companionshipDistribution, dna.languageModeDistribution, dna.platformDistribution].some((l) => l.length > 0);
  const movieP = posters.filter((p) => p.type === "movie");
  const tvP = posters.filter((p) => p.type !== "movie");
  const ranked = useMemo(() => sortRated(posters), [posters]);
  const set = (k: number, n = 3) => (ranked.length ? Array.from({ length: Math.min(n, ranked.length) }, (_, i) => ranked[(k * 3 + i) % ranked.length]) : []);
  const rewatchPct = Math.round(dna.rewatchProfile.rewatchRate * (dna.rewatchProfile.rewatchRate <= 1 ? 100 : 1));
  const genres = dna.topGenres.slice(0, 6);
  const hasRuntime = dna.runtimeProfile.averageMinutes != null && !!dna.runtimeProfile.label;

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
  };

  return (
    <div className="space-y-16 md:space-y-20 text-white overflow-x-clip">
      {/* ───────── PORTADA ───────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] min-h-[480px] md:min-h-[540px] flex flex-col justify-between gap-8 md:gap-10 px-5 py-8 md:p-12 text-center md:text-left"
        style={{ boxShadow: `${edge}, 0 30px 80px -20px rgba(0,0,0,.6)`, background: posters.length ? undefined : "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))" }}>
        <PosterWall posters={posters} />
        <div className="relative">
          <p className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-[11px] md:text-xs font-extrabold uppercase tracking-[.2em] md:tracking-[.25em] text-white/80 mb-5 md:mb-6">
            <Sparkles className="w-4 h-4" /> ADN Audiovisual <span className="text-white/40">/</span> {cls.badgeLabel}{owner && <><span className="text-white/40">/</span> @{owner}</>}
          </p>
          <h1 className="font-cinema text-6xl sm:text-7xl md:text-[10rem] leading-[0.95] [overflow-wrap:anywhere]">{title}</h1>
          {dna.summary && <p className="mt-5 text-base md:text-xl leading-relaxed font-medium text-white/90 max-w-3xl mx-auto md:mx-0 text-pretty">{dna.summary}</p>}
          {dna.tags.length > 0 && <p className="mt-5 flex flex-wrap justify-center md:justify-start gap-x-4 md:gap-x-5 gap-y-1 text-sm font-extrabold text-white/85">{dna.tags.map((t) => <span key={t}>#{t.replace(/\s+/g, "")}</span>)}</p>}
        </div>
        <div className="relative">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-y-6 gap-x-2 border-t border-white/20 pt-6 md:border-0 md:pt-0 md:[&>div]:pl-5 md:[&>div]:border-l md:[&>div]:border-white/25">
            {[
              { l: "Títulos", v: String(dna.validTitleCount) },
              { l: "Películas", v: `${dna.formatDistribution.movie}%` },
              { l: "Series", v: `${dna.formatDistribution.tv}%` },
              { l: "Confianza", v: `${dna.confidenceScore}/100` },
              { l: "Género #1", v: genres[0]?.label ?? "—" },
            ].map(({ l, v }) => (
              <div key={l} className="min-w-0">
                <p className="font-cinema text-3xl md:text-5xl leading-none truncate">{v}</p>
                <p className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider md:tracking-widest mt-2 text-white/70">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-between gap-4 mt-8">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <p className="text-xs font-bold text-white/70">Actualizado el {formatDate(dna.calculatedAt)}</p>
              {actions}
            </div>
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:gap-6 text-sm font-extrabold" aria-label="Secciones del ADN">
              {[["Gustos", "dna-gustos"], ["Cómo mirás", "dna-habitos"], ["Perfil y confianza", "dna-perfil"]].map(([l, id]) => (
                <button key={id} type="button" onClick={() => go(id)} className="text-white/85 hover:text-white underline-offset-8 hover:underline">{l}</button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* ───────── 01 GUSTOS ───────── */}
      <div className="space-y-16">
        <Opener n="01" title="Gustos" id="dna-gustos" />

        <section>
          <Sec title="Tu mezcla de géneros" hint="Cada título reparte su peso entre sus géneros" />
          {genres.length === 0 ? <Empty text="Todavía no hay géneros suficientes." /> : <GenreMosaic genres={genres} others={dna.topGenres.slice(6)} posters={posters} />}
        </section>

        <section>
          <Sec title="Películas vs series" hint="Según cantidad de títulos, no horas" />
          <FormatSplit movie={dna.formatDistribution.movie} tv={dna.formatDistribution.tv} movieP={sortRated(movieP).slice(0, 8)} tvP={sortRated(tvP).slice(0, 8)} />
        </section>

        {posters.some((p) => p.rating != null) && (
          <section>
            <Sec title="Tus mejores puntuadas" hint="Las que más alto pusiste" />
            <TopRated posters={posters} />
          </section>
        )}

        <section>
          <Sec title="Décadas" hint="De qué época son tus títulos" />
          {dna.decadeDistribution.length === 0 ? <Empty text="Todavía no hay suficiente información de años de estreno." /> : <DecadeRow items={dna.decadeDistribution} posters={posters} />}
        </section>

        <div className="grid gap-x-14 gap-y-16 lg:grid-cols-2">
          <Bath posters={set(0)}>
            <Sec title="Cómo puntuás" />
            {average != null ? <RatingBlock average={average} median={median ?? null} label={ratingLabel} distribution={distribution} coverage={coverage} posters={posters} /> : <Empty text="Todavía no puntuaste títulos. Puntuar te ayuda a afinar tu ADN." />}
          </Bath>
          {hasRuntime ? (
            <Bath posters={set(1)} offset={900}>
              <Sec title="Duración" hint="Promedio de tus películas" />
              <RuntimeBlock minutes={dna.runtimeProfile.averageMinutes as number} label={dna.runtimeProfile.label as string} posters={posters} />
            </Bath>
          ) : <span />}

          <Bath posters={set(2)} offset={300}>
            <Sec title="Países de origen" hint="Las coproducciones reparten su peso" />
            <RankList items={dna.countryDistribution} empty="Todavía no hay suficiente información de países." pick={(l) => posters.filter((p) => p.countries?.some((c) => sameName(regionName(c), l)))} />
          </Bath>
          <Bath posters={set(3)} offset={1200}>
            <Sec title="Idiomas originales" />
            <RankList items={dna.languageDistribution} empty="Todavía no hay suficiente información de idiomas." pick={(l) => posters.filter((p) => p.lang && sameName(langName(p.lang), l))} />
          </Bath>

          {dna.recurringDirectors.length > 0 && <NameList title="Directores recurrentes" list={dna.recurringDirectors} />}
          {dna.recurringCast.length > 0 && <NameList title="Actores recurrentes" list={dna.recurringCast} />}
        </div>
      </div>

      {/* ───────── 02 CÓMO MIRÁS ───────── */}
      <div className="space-y-16">
        <Opener n="02" title="Cómo mirás" id="dna-habitos" />

        {phrase && (
          <section className="relative overflow-hidden rounded-[2.5rem] min-h-[280px] flex flex-col justify-end p-7 md:p-12" style={{ boxShadow: `${edge}, 0 30px 80px -20px rgba(0,0,0,.6)` }}>
            <PosterWall posters={posters} />
            <p className="relative font-cinema text-4xl md:text-6xl leading-[1.05] text-pretty max-w-5xl">{phrase.text}</p>
            <p className="relative text-xs font-bold text-white/70 mt-4">{phrase.disclaimer}</p>
          </section>
        )}

        {!hasHabits ? (
          <section>
            <Sec title="Cómo mirás" />
            <Empty text="Todavía no hay sesiones registradas. En la ficha de cada título podés anotar dónde, cuándo y con quién lo viste, y esta sección se completa sola." />
          </section>
        ) : (
          <div className="grid gap-x-14 gap-y-14 lg:grid-cols-2">
            <HabitBlock title="Dónde lo ves" items={dna.venueDistribution} empty="Sin datos de lugar todavía." sessions={cov.venue?.sessions} posters={set(4)} offset={0} />
            <HabitBlock title="Cuándo lo ves" items={dna.timeDistribution} empty="Sin datos de horario todavía." sessions={cov.time?.sessions} posters={set(5)} offset={800} />
            <HabitBlock title="Con quién" items={dna.companionshipDistribution} empty="Sin datos de compañía todavía." sessions={cov.companionship?.sessions} posters={set(6)} offset={400} />
            <HabitBlock title="Idioma en que lo ves" items={dna.languageModeDistribution} empty="Sin datos de idioma todavía." sessions={cov.language?.sessions} posters={set(7)} offset={1200} />
            <HabitBlock title="Cómo lo ves" items={dna.platformDistribution} empty="Sin datos de plataforma todavía." sessions={cov.platform?.sessions} posters={set(8)} offset={600} />
            <Bath posters={set(9)} offset={1000}>
              <Sec title="Re-ver" hint="Cuánto volvés a lo que ya viste" />
              <div className="flex flex-wrap items-center gap-8">
                <Ring pct={rewatchPct} size={150} stroke={12}><span className="font-cinema text-5xl leading-none"><CountUp value={rewatchPct} suffix="%" /></span></Ring>
                <div className="grid grid-cols-3 gap-6">
                  {[{ n: dna.rewatchProfile.rewatchSessions, l: "re-vistas" }, { n: dna.rewatchProfile.uniqueTitles, l: "títulos únicos" }, { n: dna.rewatchProfile.totalSessions, l: "sesiones" }].map(({ n, l }) => (
                    <div key={l}><p className="font-cinema text-5xl leading-none">{n}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70 mt-2">{l}</p></div>
                  ))}
                </div>
              </div>
            </Bath>
          </div>
        )}

        {dna.reactionDistribution.length > 0 && (
          <Bath posters={set(10)}>
            <Sec title="Qué te dejan" hint="Reacciones que más elegís" />
            <ReactionWords items={dna.reactionDistribution} />
          </Bath>
        )}
      </div>

      {/* ───────── 03 PERFIL Y CONFIANZA ───────── */}
      <div className="space-y-16">
        <Opener n="03" title="Perfil y confianza" id="dna-perfil" />

        <section>
          <Sec title="Tu perfil de espectador" hint="Etiquetas calculadas con reglas, sin IA" />
          {dna.contextTags.length === 0 ? <Empty text="Todavía no hay suficientes sesiones para inferir un perfil." /> : (
            <div className="grid gap-x-14 lg:grid-cols-2">
              {dna.contextTags.map((t, i) => (
                <Bath key={t.slug} posters={set(i + 11, 2)} offset={i * 700} strength={0.8}>
                  <TagRow title={t.label} pct={Math.round(t.score <= 1 ? t.score * 100 : t.score)} text={t.explanation} poster={ranked[(i * 5 + 2) % Math.max(1, ranked.length)]} />
                </Bath>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-x-14 gap-y-14 lg:grid-cols-2">
          <Bath posters={set(20)}>
            <Sec title="Confianza del ADN" hint={cls.hint} />
            <div className="flex flex-wrap items-center gap-8">
              <Ring pct={dna.confidenceScore} size={160} stroke={14}>
                <span className="font-cinema text-6xl leading-none"><CountUp value={dna.confidenceScore} /></span>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/70 mt-1">de 100</span>
              </Ring>
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                {[{ n: dna.validTitleCount, l: "títulos válidos" }, { n: dna.ratedTitleCount, l: "puntuados" }].map(({ n, l }) => (
                  <div key={l}><p className="font-cinema text-5xl leading-none">{n}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70 mt-2">{l}</p></div>
                ))}
                <div className="col-span-2"><p className="font-cinema text-3xl leading-tight">{cls.label}</p><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70 mt-1">estado</p></div>
              </div>
            </div>
          </Bath>

          {Object.keys(cov).length > 0 && (
            <Bath posters={set(21)} offset={900}>
              <Sec title="Cobertura del contexto" hint="Cuántas sesiones respaldan cada dato" />
              <ul className="divide-y divide-white/10">
                {Object.entries(cov).map(([k, c]) => (
                  <li key={k} className="flex items-baseline gap-4 py-3">
                    <span className="font-cinema text-4xl leading-none w-14">{c.sessions}</span>
                    <span className="text-sm font-extrabold flex-1">{c.label}</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/65">{c.level}</span>
                  </li>
                ))}
              </ul>
            </Bath>
          )}
        </div>
      </div>
    </div>
  );
}

function ReactionWords({ items }: { items: WeightedMetric[] }) {
  const tint = useContext(BathTint);
  return (
    <p className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
      {items.map((r, i) => (
        <span key={r.key} className="font-cinema leading-none inline-flex items-baseline gap-2.5 text-4xl md:text-5xl" style={{ color: i === 0 ? tintCss(tint, 1) : "rgba(255,255,255,.88)", transition: "color 1.6s" }}>
          {r.label}<span className="font-sans text-xs font-extrabold text-white/65">{r.percentage}%</span>
        </span>
      ))}
    </p>
  );
}
