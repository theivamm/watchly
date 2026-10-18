
import "@/styles/cinema.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Clapperboard, Crown, Dna, Globe2, Laugh, RefreshCw, Shuffle, Sparkles, Star, Timer, Tv, UserPlus, Users, X, Zap } from "lucide-react";
import { DEFAULT_TINT, getDominantColor, rgba, type RGB } from "@/lib/posterColor";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import { useRandomCovers } from "@/hooks/useRandomCovers";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { genreLabel } from "@/lib/genres";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { TMDBSearchResult } from "@/types";

const whiteBtn = "inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]";
const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white hover:text-white transition-transform hover:scale-[1.03]";
const fringeText = { textShadow: "-2px 0 rgba(255,60,130,.75), 2px 0 rgba(60,200,255,.75)" };
const FRINGE = ["sepia(1) saturate(6) hue-rotate(-50deg)", "sepia(1) saturate(6) hue-rotate(150deg)"];
const edgeShadow = "inset 3px 0 0 rgba(255,80,140,.55), inset -3px 0 0 rgba(70,180,255,.55), inset 0 1px 0 rgba(255,255,255,.3), 0 30px 70px -10px rgba(0,0,0,.8)";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Póster con aberración cromática: dos copias desplazadas en rosa y cian. */
function ChromaPoster({ it, size = "w342", className = "", rounded = "rounded-[1.4rem]", spread = 7 }: { it: TMDBSearchResult; size?: Parameters<typeof getPosterUrl>[1]; className?: string; rounded?: string; spread?: number }) {
  const src = getPosterUrl(it.posterPath, size);
  return (
    <div className={`relative ${className}`}>
      {[-1, 1].map((d) => (
        <img key={d} src={src} alt="" aria-hidden="true" loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${rounded} opacity-60`}
          style={{ transform: `translate(${d * spread}px, ${-d * 2}px)`, mixBlendMode: "screen", filter: FRINGE[d < 0 ? 0 : 1] }} />
      ))}
      <img src={src} alt={it.title} loading="lazy" className={`relative w-full h-full object-cover ${rounded} border border-white/30`} />
    </div>
  );
}

/** Cinta de portadas en movimiento, dos filas en sentidos opuestos. */
function CoverRibbon({ items, title }: { items: TMDBSearchResult[]; title?: string }) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)].filter((r) => r.length > 0);
  if (rows.length === 0) return null;
  return (
    <section className="relative py-14 overflow-hidden" aria-hidden="true">
      {title && <p className="font-cinema text-center text-4xl md:text-6xl leading-none mb-9 px-5" style={fringeText}>{title}</p>}
      <div className="space-y-4">
        {rows.map((r, ri) => (
          <div key={ri} className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex shrink-0 gap-4 pr-4 guest-marquee" style={{ animationDirection: ri ? "reverse" : "normal", animationDuration: ri ? "80s" : "65s" }}>
              {[...r, ...r, ...r, ...r].map((it, i) => (
                <img key={i} src={getPosterUrl(it.posterPath, "w342")} alt="" loading="lazy"
                  className="h-44 md:h-60 aspect-[2/3] object-cover rounded-[1.4rem] border border-white/20 shadow-[0_20px_44px_-16px_rgba(0,0,0,.7)]"
                  style={{ boxShadow: ri ? "-3px 0 0 rgba(255,80,140,.4), 20px 20px 44px -20px rgba(0,0,0,.7)" : "3px 0 0 rgba(70,180,255,.4), 20px 20px 44px -20px rgba(0,0,0,.7)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Invitación final: muro de portadas de fondo, vidrio al frente y tres pósters en abanico. */
function SignupCta({ title, text, covers }: { title: string; text: string; covers: TMDBSearchResult[] }) {
  const wall = covers.slice(0, 16);
  const fan = covers.slice(0, 3);
  return (
    <section className="relative px-5 md:px-14 pb-24">
      <div className="liquid-menu relative max-w-[1200px] mx-auto rounded-[3rem] overflow-hidden" style={{ animation: "none", boxShadow: edgeShadow }}>
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-6 md:grid-cols-8 gap-3 p-3 -rotate-6 scale-[1.4] opacity-30">
          {wall.map((p, i) => <img key={`${p.tmdbId}-${i}`} src={getPosterUrl(p.posterPath, "w185")} alt="" loading="lazy" className="aspect-[2/3] w-full object-cover rounded-xl" />)}
        </div>
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(12,10,24,.95) 0%, rgba(12,10,24,.78) 48%, rgba(12,10,24,.3) 100%)" }} />
        <div className="relative grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 items-center px-7 md:px-14 py-14 md:py-16">
          <div className="text-center md:text-left">
            <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Sparkles className="w-4 h-4" /> Gratis</span>
            <h2 className="font-cinema text-5xl md:text-7xl leading-[0.95] mt-6" style={fringeText}>{title}</h2>
            <p className="text-base md:text-lg text-white/85 mt-5 max-w-xl mx-auto md:mx-0">{text}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-9">
              <Link to="/registro" className={whiteBtn}><UserPlus className="w-5 h-5" /> Crear mi cuenta</Link>
              <Link to="/login" className={glassBtn}>Ya tengo cuenta</Link>
            </div>
          </div>
          {fan.length === 3 && (
            <div className="relative h-[300px] md:h-[380px] w-full max-w-[420px] mx-auto" aria-hidden="true">
              <ChromaPoster it={fan[1]} size="w500" className="absolute left-0 top-12 w-[42%] aspect-[2/3] -rotate-[10deg] opacity-90" />
              <ChromaPoster it={fan[2]} size="w500" className="absolute right-0 top-14 w-[42%] aspect-[2/3] rotate-[9deg] opacity-90" />
              <ChromaPoster it={fan[0]} size="w500" className="absolute left-1/2 -translate-x-1/2 top-0 w-[48%] aspect-[2/3] z-10 shadow-[0_40px_80px_-10px_rgba(0,0,0,.9)] rounded-[1.4rem]" spread={9} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function useHeroItems() {
  const { data } = useTrending("all");
  const items = (data?.results ?? []).filter((i) => i.backdropPath && i.posterPath).slice(0, 6);
  const hero = useHeroCycle(items.map((i) => i.posterPath));
  return { items, hero, all: data?.results ?? [] };
}

/* ───────────────────────── Tendencias ───────────────────────── */

type Tab = "all" | "movie" | "tv";
const TABS: { id: Tab; label: string }[] = [{ id: "all", label: "Todo" }, { id: "movie", label: "Películas" }, { id: "tv", label: "Series" }];

export function TrendingPublicPage() {
  usePageTitle("Tendencias de la semana | Watchly", "Las películas y series más vistas de la semana. Guardalas en tu biblioteca con Watchly.");
  const { items, hero, all } = useHeroItems();
  const movies = useTrending("movie").data?.results ?? [];
  const series = useTrending("tv").data?.results ?? [];
  const covers = useRandomCovers(24);
  const [tab, setTab] = useState<Tab>("all");
  const [picked, setPicked] = useState<TMDBSearchResult | null>(null);
  const top3 = all.filter((i) => i.backdropPath && i.posterPath).slice(0, 3);

  return (
    <div className="min-h-screen text-white">
      <section className="relative min-h-[70svh] flex flex-col overflow-hidden">
        <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} chroma />
        <PublicNav />
        <div className="relative z-10 flex-1 flex flex-col justify-center px-5 md:px-14 py-14 max-w-3xl">
          <span className="liquid-glass-sm inline-flex self-start items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Zap className="w-4 h-4" /> Esta semana</span>
          <h1 className="font-cinema text-6xl md:text-8xl leading-[1] mt-6 drop-shadow-[0_10px_60px_rgba(0,0,0,.5)]">Lo que todos están viendo</h1>
          <p className="text-lg text-white/85 mt-5 max-w-xl">Las películas y series más populares de la semana. Creá tu cuenta para guardarlas, calificarlas y armar tus listas.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/registro" className={whiteBtn}><UserPlus className="w-5 h-5" /> Empezar gratis</Link>
          </div>
        </div>
      </section>

      {top3.length === 3 && (
        <section className="px-5 md:px-14 pt-14">
          <h2 className="font-cinema text-4xl md:text-5xl leading-none mb-6 flex items-center gap-3"><Crown className="w-7 h-7 text-white/70" /> El podio de la semana</h2>
          <div className="grid lg:grid-cols-3 gap-5">
            {top3.map((it, i) => (
              <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => setPicked(it)} className="group relative text-left text-white overflow-hidden rounded-[2.2rem] min-h-[340px] md:min-h-[400px] border border-white/20 flex flex-col justify-end"
                style={{ boxShadow: edgeShadow }}>
                <img src={getBackdropUrl(it.backdropPath, "w780")} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,7,16,.15) 0%, rgba(8,7,16,.55) 45%, rgba(8,7,16,.96) 100%)" }} />
                <div aria-hidden="true" className="absolute -top-16 -left-12 w-52 h-52 rounded-full blur-[80px] opacity-70" style={{ background: "rgba(255,50,130,.45)" }} />
                <div aria-hidden="true" className="absolute -bottom-20 -right-12 w-60 h-60 rounded-full blur-[90px] opacity-60" style={{ background: "rgba(40,190,255,.4)" }} />
                <ChromaPoster it={it} size="w185" rounded="rounded-2xl" spread={5} className="absolute top-5 right-5 w-24 aspect-[2/3] rotate-3 group-hover:rotate-0 transition-transform" />
                <div className="relative p-6 md:p-8">
                  <span className="font-cinema text-8xl md:text-9xl leading-none block" style={fringeText}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-cinema text-4xl leading-[0.95] mt-1 line-clamp-2">{it.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {it.tmdbRating ? <span className="liquid-glass-sm px-3 py-1 rounded-full text-[11px] font-extrabold">★ {it.tmdbRating.toFixed(1)}</span> : null}
                    <span className="liquid-glass-sm px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">{it.mediaType === "movie" ? "Película" : "Serie"}</span>
                    {genreLabel(it.genreIds) && <span className="liquid-glass-sm px-3 py-1 rounded-full text-[11px] font-bold">{genreLabel(it.genreIds)}</span>}
                  </div>
                  {it.overview && <p className="text-sm text-white/75 mt-3 leading-relaxed line-clamp-2">{it.overview}</p>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="px-5 md:px-14 py-14 space-y-14">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar tendencias">
          {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} data-active={tab === t.id} onClick={() => setTab(t.id)} className="frost-tab">{t.label}</button>)}
        </div>
        {tab !== "tv" && <PosterGrid title="Películas en tendencia" icon={Clapperboard} items={movies} onPick={setPicked} />}
        {tab !== "movie" && <PosterGrid title="Series en tendencia" icon={Tv} items={series} onPick={setPicked} />}
      </div>

      <CoverRibbon items={covers} title="Todo esto puede ser tuyo" />
      <SignupCta title="Guardá lo que querés ver" text="Con Watchly armás tu biblioteca de películas y series, calificás lo que viste y descubrís tu ADN audiovisual. Sin publicidad." covers={covers} />
      <PublicFooter items={items} index={hero.index} />
      {picked && createPortal(<GuestJoinModal item={picked} onClose={() => setPicked(null)} />, document.body)}
    </div>
  );
}

function PosterGrid({ title, icon: Icon, items, onPick }: { title: string; icon: typeof Tv; items: TMDBSearchResult[]; onPick: (it: TMDBSearchResult) => void }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-cinema text-4xl md:text-5xl leading-none mb-6 flex items-center gap-3"><Icon className="w-7 h-7 text-white/70" /> {title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {items.slice(0, 18).map((it, i) => (
          <button type="button" key={`${it.mediaType}-${it.tmdbId}`} onClick={() => onPick(it)} title={`Guardá «${it.title}» en tu biblioteca`} className="group text-left text-white">
            <div className="relative aspect-[2/3] rounded-[1.4rem] overflow-hidden border border-white/15 shadow-[0_20px_44px_-16px_rgba(0,0,0,.7)] transition-shadow duration-300 group-hover:shadow-[-4px_0_0_rgba(255,80,140,.55),4px_0_0_rgba(70,180,255,.55),0_24px_50px_-14px_rgba(0,0,0,.8)]">
              <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="liquid-glass-sm absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold">{i + 1}</span>
              {it.tmdbRating ? <span className="liquid-glass-sm absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">★ {it.tmdbRating.toFixed(1)}</span> : null}
              <div className="absolute inset-x-2 bottom-2 liquid-glass rounded-2xl px-3 py-2 text-xs font-extrabold text-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                + Guardar en mi biblioteca
              </div>
            </div>
            <p className="mt-2.5 px-1 text-sm font-extrabold truncate">{it.title}</p>
            <p className="px-1 text-xs text-white/60 truncate">{[it.year, genreLabel(it.genreIds)].filter(Boolean).join(" · ")}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Invitación a crear cuenta al tocar un título sin sesión. Se tiñe con el color del póster. */
function GuestJoinModal({ item, onClose }: { item: TMDBSearchResult; onClose: () => void }) {
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);
  const closeRef = useRef<HTMLButtonElement>(null);
  const from = `?from=${encodeURIComponent(window.location.pathname)}`;

  useEffect(() => {
    let cancelled = false;
    if (item.posterPath) getDominantColor(getPosterUrl(item.posterPath, "w200")).then((c) => { if (!cancelled) setTint(c); }).catch(() => {});
    return () => { cancelled = true; };
  }, [item.posterPath]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const accent = rgba(tint, 1);
  const poster = getPosterUrl(item.posterPath, "w500");
  const backdrop = item.backdropPath ? getBackdropUrl(item.backdropPath, "w1280") : poster;
  const perks = [
    { icon: Bookmark, t: `Guardá «${item.title}» en tu lista para ver` },
    { icon: Star, t: "Calificá lo que viste y armá tus listas" },
    { icon: Dna, t: "Descubrí tu ADN audiovisual y recibí recomendaciones" },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 md:p-8 text-white animate-fade-in" onClick={onClose}
      style={{ background: `radial-gradient(60% 60% at 50% 45%, ${rgba(tint, 0.28)}, rgba(5,5,12,.72) 70%)`, backdropFilter: "blur(18px) saturate(140%)", WebkitBackdropFilter: "blur(18px) saturate(140%)" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="guest-join-title" onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92svh] overflow-y-auto no-scrollbar rounded-[2.5rem] border border-white/25 animate-pop"
        style={{
          background: "rgba(10,9,20,.94)",
          boxShadow: `inset 3px 0 0 rgba(255,80,140,.55), inset -3px 0 0 rgba(70,180,255,.55), inset 0 1px 0 rgba(255,255,255,.3), 0 40px 100px -20px ${rgba(tint, 0.55)}, 0 30px 70px -10px rgba(0,0,0,.85)`,
        }}>
        {/* Fondo: imagen del título teñida con su color */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
          <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 scale-110" style={{ filter: "blur(2px) saturate(1.3)" }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(115deg, rgba(10,9,20,.97) 0%, rgba(10,9,20,.86) 45%, ${rgba(tint, 0.35)} 100%)` }} />
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] opacity-60" style={{ background: "#ff3c82" }} />
          <div className="absolute -bottom-28 -right-20 w-96 h-96 rounded-full blur-[110px] opacity-70" style={{ background: accent }} />
        </div>

        <button ref={closeRef} type="button" onClick={onClose} aria-label="Cerrar"
          className="liquid-glass-sm absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 md:gap-9 p-6 md:p-10 items-center">
          {/* Póster con aberración cromática */}
          <div className="relative mx-auto w-28 sm:w-40 md:w-full max-w-[260px] aspect-[2/3]">
            <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[1.6rem] opacity-60"
              style={{ transform: "translate(-9px, 3px)", mixBlendMode: "screen", filter: "sepia(1) saturate(6) hue-rotate(-50deg)" }} />
            <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[1.6rem] opacity-60"
              style={{ transform: "translate(9px, -3px)", mixBlendMode: "screen", filter: "sepia(1) saturate(6) hue-rotate(150deg)" }} />
            <img src={poster} alt={item.title} className="relative w-full h-full object-cover rounded-[1.6rem] border border-white/30"
              style={{ boxShadow: `0 30px 60px -12px rgba(0,0,0,.8), 0 0 50px -6px ${rgba(tint, 0.65)}` }} />
            {item.tmdbRating ? (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-extrabold text-[#111] whitespace-nowrap" style={{ background: accent }}>
                ★ {item.tmdbRating.toFixed(1)}
              </span>
            ) : null}
          </div>

          <div className="text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">{item.mediaType === "movie" ? "Película" : "Serie"}</span>
              {item.year && <span className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-[11px] font-extrabold">{item.year}</span>}
              {genreLabel(item.genreIds) && <span className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-[11px] font-bold">{genreLabel(item.genreIds)}</span>}
            </div>
            <h2 id="guest-join-title" className="font-cinema text-4xl md:text-6xl leading-[0.95] mt-4 line-clamp-3"
              style={{ textShadow: "-2px 0 rgba(255,60,130,.75), 2px 0 rgba(60,200,255,.75)" }}>
              {item.title}
            </h2>
            {item.overview && <p className="hidden sm:block text-sm text-white/75 mt-3 leading-relaxed line-clamp-3">{item.overview}</p>}

            <p className="font-extrabold text-base mt-4 sm:mt-6">Creá tu cuenta gratis para guardarla</p>
            <ul className="mt-3 space-y-2.5 text-left inline-block">
              {perks.map(({ icon: P, t }) => (
                <li key={t} className="flex items-start gap-3 text-sm text-white/85">
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: rgba(tint, 0.25), border: `1px solid ${rgba(tint, 0.5)}` }}>
                    <P className="w-3.5 h-3.5" />
                  </span>
                  <span className="pt-1">{t}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-3 mt-5 sm:mt-7">
              <Link to={`/registro${from}`} className={`${whiteBtn} flex-1 !px-5 whitespace-nowrap`} style={{ boxShadow: `0 14px 40px -6px ${rgba(tint, 0.7)}` }}>
                <UserPlus className="w-5 h-5" /> Crear cuenta gratis
              </Link>
              <Link to={`/login${from}`} className={`${glassBtn} flex-1 !px-5 whitespace-nowrap`}>Iniciar sesión</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Presentación de funciones ───────────────────────── */

const FEATURES = {
  adn: {
    title: "ADN Audiovisual | Watchly",
    badge: "ADN Audiovisual",
    icon: Dna,
    heading: "Descubrí qué dice tu cine de vos",
    lead: "Watchly convierte lo que ves en un perfil de gustos único: tus géneros, tus décadas, los países que recorriste y los directores a los que siempre volvés.",
    steps: [
      { icon: Clapperboard, t: "Cargá lo que viste", d: "Buscá películas y series y sumalas a tu biblioteca en segundos.", g: [] as number[] },
      { icon: Star, t: "Calificá", d: "Con 5 títulos ya tenés un ADN preliminar; con 10, uno completo.", g: [] as number[] },
      { icon: Dna, t: "Mirá tu ADN", d: "Géneros, décadas, países, directores y una frase que te resume.", g: [] as number[] },
      { icon: Users, t: "Compartilo", d: "Un perfil público con link propio para mostrarle a quien quieras.", g: [] as number[] },
    ],
    preview: [
      { l: "Drama", v: 34 }, { l: "Crimen", v: 22 }, { l: "Ciencia ficción", v: 18 }, { l: "Comedia", v: 14 }, { l: "Thriller", v: 12 },
    ],
    previewTitle: "Así se ve un ADN",
    previewQuote: "«En tu pantalla predominan el drama y el crimen, con debilidad por los 90 y el cine coreano.»",
    ctaTitle: "Tu ADN te está esperando",
    ctaText: "Creá tu cuenta gratis, cargá 5 títulos y descubrí tu perfil audiovisual. Además te recomendamos qué ver según tus gustos.",
  },
  tonight: {
    title: "¿Qué vemos hoy? | Watchly",
    badge: "¿Qué vemos hoy?",
    icon: Shuffle,
    heading: "Se terminó el «¿qué vemos?» eterno",
    lead: "Decinos cómo es tu momento y Watchly elige entre lo que ya tenías ganas de ver. Sin scrollear media hora y sin discutir.",
    steps: [
      { icon: Shuffle, t: "Sorprendeme", d: "Una elección al azar entre tus pendientes.", g: [] as number[] },
      { icon: Timer, t: "Algo rápido", d: "Películas cortas o capítulos para una noche corta.", g: [16, 35] },
      { icon: Laugh, t: "Quiero reírme", d: "Comedias de tu lista, listas para arrancar.", g: [35] },
      { icon: Zap, t: "Quiero tensión", d: "Thrillers y suspenso para no despegarte de la pantalla.", g: [53, 27, 9648] },
      { icon: Users, t: "Para compartir", d: "Opciones que funcionan para ver en pareja o con amigos.", g: [12, 10751, 14] },
      { icon: Globe2, t: "Descubrir con mi ADN", d: "Títulos nuevos que encajan con tus gustos.", g: [878, 18] },
    ],
    preview: null,
    previewTitle: "",
    previewQuote: "",
    ctaTitle: "Esta noche elegís en segundos",
    ctaText: "Creá tu cuenta gratis, guardá lo que querés ver y dejá que Watchly decida por vos cuando no sepas qué poner.",
  },
} as const;

/** Demo interactiva: elegí un ánimo y Watchly saca un título (con cuenta, de tus pendientes). */
function TonightDemo({ pool, steps }: { pool: TMDBSearchResult[]; steps: readonly { icon: typeof Tv; t: string; g: readonly number[] }[] }) {
  const [mood, setMood] = useState(0);
  const [n, setN] = useState(0);
  const deck = useMemo(() => {
    const g = steps[mood].g;
    const match = g.length ? pool.filter((p) => p.genreIds?.some((x) => g.includes(x))) : pool;
    return shuffle(match.length >= 3 ? match : pool);
  }, [pool, steps, mood]);
  if (deck.length === 0) return null;
  const cur = deck[n % deck.length];
  return (
    <section className="px-5 md:px-14 pb-20">
      <div className="liquid-menu relative max-w-[1000px] mx-auto rounded-[2.5rem] p-6 md:p-10 overflow-hidden" style={{ animation: "none", boxShadow: edgeShadow }}>
        <img key={cur.tmdbId} src={getBackdropUrl(cur.backdropPath ?? cur.posterPath, "w780")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-25 scale-110 animate-fade-in" style={{ filter: "blur(6px) saturate(1.3)" }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(110deg, rgba(12,10,24,.9), rgba(12,10,24,.55))" }} />
        <div className="relative">
          <p className="text-xs font-extrabold tracking-[.2em] uppercase text-white/70 flex items-center gap-2"><Shuffle className="w-4 h-4" /> Probalo ahora · sin cuenta</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {steps.map((s, i) => (
              <button key={s.t} type="button" data-active={mood === i} onClick={() => { setMood(i); setN(0); }} className="frost-tab"><s.icon className="w-4 h-4" /> {s.t}</button>
            ))}
          </div>
          <div className="grid md:grid-cols-[200px_minmax(0,1fr)] gap-7 md:gap-10 items-center mt-8">
            <ChromaPoster key={cur.tmdbId} it={cur} size="w500" spread={8} className="w-40 md:w-full aspect-[2/3] mx-auto animate-pop" />
            <div className="text-center md:text-left">
              <p className="text-xs font-extrabold tracking-[.25em] uppercase text-white/70">Hoy toca</p>
              <h3 key={`t-${cur.tmdbId}`} className="font-cinema text-5xl md:text-7xl leading-[0.95] mt-2 animate-pop" style={fringeText}>{cur.title}</h3>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                {cur.tmdbRating ? <span className="liquid-glass-sm px-3 py-1 rounded-full text-xs font-extrabold">★ {cur.tmdbRating.toFixed(1)}</span> : null}
                {cur.year && <span className="liquid-glass-sm px-3 py-1 rounded-full text-xs font-extrabold">{cur.year}</span>}
                {genreLabel(cur.genreIds) && <span className="liquid-glass-sm px-3 py-1 rounded-full text-xs font-bold">{genreLabel(cur.genreIds)}</span>}
              </div>
              {cur.overview && <p className="text-sm md:text-base text-white/80 mt-4 leading-relaxed line-clamp-3 max-w-xl">{cur.overview}</p>}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                <button type="button" onClick={() => setN((v) => v + 1)} className={glassBtn}><RefreshCw className="w-4 h-4" /> Tocá otra vez</button>
                <Link to="/registro" className={whiteBtn}><Bookmark className="w-4 h-4" /> Guardarla</Link>
              </div>
              <p className="text-xs text-white/60 mt-4">Acá elegimos entre las más vistas. Con tu cuenta, elige entre lo que vos guardaste.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Vista previa de un ADN: frase, barras de géneros y los títulos que lo definen. */
function DnaPreview({ f, picks }: { f: { previewTitle: string; previewQuote: string; preview: readonly { l: string; v: number }[] }; picks: TMDBSearchResult[] }) {
  return (
    <section className="px-5 md:px-14 pb-20">
      <div className="liquid-menu relative max-w-[1100px] mx-auto rounded-[2.5rem] p-7 md:p-10 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-10 items-center overflow-hidden" style={{ animation: "none", boxShadow: edgeShadow }}>
        <div>
          <p className="text-xs font-extrabold tracking-[.2em] uppercase text-white/70 flex items-center gap-2"><Dna className="w-4 h-4" /> {f.previewTitle} · ejemplo</p>
          <p className="font-cinema text-3xl md:text-4xl leading-tight mt-4">{f.previewQuote}</p>
          <ul className="mt-7 space-y-3.5">
            {f.preview.map((g) => (
              <li key={g.l}>
                <div className="flex justify-between text-sm font-bold"><span>{g.l}</span><span className="text-white/70 tabular-nums">{g.v}%</span></div>
                <div className="h-2.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${g.v * 2.5}%`, background: "linear-gradient(90deg, #ff5a8c, #fff 55%, #5aaaff)" }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        {picks.length >= 6 && (
          <div>
            <p className="text-xs font-extrabold tracking-[.2em] uppercase text-white/70 mb-4">Títulos que lo definen</p>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {picks.slice(0, 6).map((p, i) => (
                <ChromaPoster key={p.tmdbId} it={p} rounded="rounded-2xl" spread={5} className={`aspect-[2/3] ${i % 2 ? "translate-y-4" : ""}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function FeaturePromoPage({ kind }: { kind: keyof typeof FEATURES }) {
  const f = FEATURES[kind];
  usePageTitle(f.title, f.lead);
  const { items, hero, all } = useHeroItems();
  const covers = useRandomCovers(24);
  const Icon = f.icon;
  const withPoster = all.filter((i) => i.posterPath);
  const backs = all.filter((i) => i.backdropPath);
  const picks = covers.slice(0, 6);

  return (
    <div className="min-h-screen text-white">
      <section className="relative min-h-[82svh] flex flex-col overflow-hidden">
        <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} chroma />
        <PublicNav />
        <div className="relative z-10 flex-1 flex items-center px-5 md:px-14 py-14">
          <div className="max-w-3xl">
            <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Icon className="w-4 h-4" /> {f.badge}</span>
            <h1 className="font-cinema text-6xl md:text-8xl leading-[1] mt-6 drop-shadow-[0_10px_60px_rgba(0,0,0,.5)]">{f.heading}</h1>
            <p className="text-lg md:text-xl text-white/85 mt-5 max-w-2xl leading-relaxed">{f.lead}</p>
            <div className="flex flex-wrap gap-3 mt-9">
              <Link to="/registro" className={whiteBtn}><UserPlus className="w-5 h-5" /> Crear mi cuenta gratis</Link>
              <Link to="/login" className={glassBtn}>Ya tengo cuenta <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 md:px-14 py-16">
        <p className="text-xs font-extrabold tracking-[.25em] uppercase text-center text-white/70">Qué es Watchly</p>
        <h2 className="font-cinema text-5xl md:text-7xl text-center mt-4 max-w-4xl mx-auto leading-none">Tu biblioteca de películas y series, con personalidad</h2>
        <p className="text-base md:text-lg text-center text-white/75 max-w-2xl mx-auto mt-5">
          Guardá lo que viste y lo que querés ver, calificá, armá listas, compartí tu perfil y recibí recomendaciones hechas a tu medida.
        </p>
      </section>

      <section className="px-5 md:px-14 pb-16">
        <div className={`grid gap-5 max-w-[1200px] mx-auto ${f.steps.length > 4 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {f.steps.map(({ icon: S, t, d }, i) => {
            const bd = backs.length ? backs[(i * 2 + 3) % backs.length] : null;
            return (
              <div key={t} className="liquid-glass rounded-[2rem] overflow-hidden flex flex-col">
                <div className="relative h-36 md:h-40 overflow-hidden">
                  {bd && <img src={getBackdropUrl(bd.backdropPath, "w780")} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ WebkitMaskImage: "linear-gradient(180deg,#000 45%,transparent)", maskImage: "linear-gradient(180deg,#000 45%,transparent)" }} />}
                  <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,50,130,.22), transparent 55%, rgba(40,190,255,.2))" }} />
                  <span className="liquid-glass-sm absolute top-4 left-4 w-12 h-12 rounded-full flex items-center justify-center"><S className="w-5 h-5" /></span>
                  {kind === "adn" && <span className="font-cinema absolute top-3 right-5 text-5xl text-white/80" style={fringeText}>{String(i + 1).padStart(2, "0")}</span>}
                </div>
                <div className="p-6 pt-3">
                  <h3 className="font-cinema text-3xl leading-tight">{t}</h3>
                  <p className="text-sm text-white/75 mt-2 leading-relaxed">{d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {kind === "adn" && f.preview ? <DnaPreview f={{ previewTitle: f.previewTitle, previewQuote: f.previewQuote, preview: f.preview }} picks={picks} /> : <TonightDemo pool={withPoster} steps={f.steps} />}

      <CoverRibbon items={covers} title={kind === "adn" ? "Tu cine, tu huella" : "Hay mucho para ver"} />
      <SignupCta title={f.ctaTitle} text={f.ctaText} covers={covers} />
      <PublicFooter items={items} index={hero.index} />
    </div>
  );
}
