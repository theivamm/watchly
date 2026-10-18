import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ArrowRight, Bookmark, Clapperboard, Dna, Globe2, Laugh, Shuffle, Sparkles, Star, Timer, Tv, UserPlus, Users, X, Zap } from "lucide-react";
import { DEFAULT_TINT, getDominantColor, rgba, type RGB } from "@/lib/posterColor";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import PublicNav from "@/components/layout/PublicNav";
import PublicFooter from "@/components/layout/PublicFooter";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { genreLabel } from "@/lib/genres";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { TMDBSearchResult } from "@/types";

const whiteBtn = "inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]";
const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white hover:text-white transition-transform hover:scale-[1.03]";

function SignupCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="relative px-5 md:px-14 pb-24">
      <div className="liquid-menu relative max-w-[1100px] mx-auto rounded-[3rem] px-8 py-14 md:py-16 text-center overflow-hidden" style={{ transformOrigin: "center" }}>
        <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest"><Sparkles className="w-4 h-4" /> Gratis</span>
        <h2 className="font-cinema text-5xl md:text-7xl leading-none mt-6">{title}</h2>
        <p className="text-base md:text-lg text-white/80 mx-auto mt-5 max-w-xl">{text}</p>
        <div className="flex flex-wrap justify-center gap-3 mt-9">
          <Link to="/registro" className={whiteBtn}><UserPlus className="w-5 h-5" /> Crear mi cuenta</Link>
          <Link to="/login" className={glassBtn}>Ya tengo cuenta</Link>
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

export function TrendingPublicPage() {
  usePageTitle("Tendencias de la semana | Watchly", "Las películas y series más vistas de la semana. Guardalas en tu biblioteca con Watchly.");
  const { items, hero } = useHeroItems();
  const movies = useTrending("movie").data?.results ?? [];
  const series = useTrending("tv").data?.results ?? [];

  return (
    <div className="min-h-screen text-white">
      <section className="relative min-h-[70svh] flex flex-col overflow-hidden">
        <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />
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

      <div className="px-5 md:px-14 py-16 space-y-16">
        <PosterGrid title="Películas en tendencia" icon={Clapperboard} items={movies} />
        <PosterGrid title="Series en tendencia" icon={Tv} items={series} />
      </div>

      <SignupCta title="Guardá lo que querés ver" text="Con Watchly armás tu biblioteca de películas y series, calificás lo que viste y descubrís tu ADN audiovisual. Sin publicidad." />
      <PublicFooter items={items} index={hero.index} />
    </div>
  );
}

function PosterGrid({ title, icon: Icon, items }: { title: string; icon: typeof Tv; items: TMDBSearchResult[] }) {
  const [picked, setPicked] = useState<TMDBSearchResult | null>(null);
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-cinema text-4xl md:text-5xl leading-none mb-6 flex items-center gap-3"><Icon className="w-7 h-7 text-white/70" /> {title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {items.slice(0, 18).map((it, i) => (
          <button type="button" key={`${it.mediaType}-${it.tmdbId}`} onClick={() => setPicked(it)} title={`Guardá «${it.title}» en tu biblioteca`} className="group text-left text-white">
            <div className="relative aspect-[2/3] rounded-[1.4rem] overflow-hidden border border-white/15 shadow-[0_20px_44px_-16px_rgba(0,0,0,.7)]">
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
      {picked && createPortal(<GuestJoinModal item={picked} onClose={() => setPicked(null)} />, document.body)}
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
      { icon: Clapperboard, t: "Cargá lo que viste", d: "Buscá películas y series y sumalas a tu biblioteca en segundos." },
      { icon: Star, t: "Calificá", d: "Con 5 títulos ya tenés un ADN preliminar; con 10, uno completo." },
      { icon: Dna, t: "Mirá tu ADN", d: "Géneros, décadas, países, directores y una frase que te resume." },
      { icon: Users, t: "Compartilo", d: "Un perfil público con link propio para mostrarle a quien quieras." },
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
      { icon: Shuffle, t: "Sorprendeme", d: "Una elección al azar entre tus pendientes." },
      { icon: Timer, t: "Algo rápido", d: "Películas cortas o capítulos para una noche corta." },
      { icon: Laugh, t: "Quiero reírme", d: "Comedias de tu lista, listas para arrancar." },
      { icon: Zap, t: "Quiero tensión", d: "Thrillers y suspenso para no despegarte de la pantalla." },
      { icon: Users, t: "Para compartir", d: "Opciones que funcionan para ver en pareja o con amigos." },
      { icon: Globe2, t: "Descubrir con mi ADN", d: "Títulos nuevos que encajan con tus gustos." },
    ],
    preview: null,
    previewTitle: "",
    previewQuote: "",
    ctaTitle: "Esta noche elegís en segundos",
    ctaText: "Creá tu cuenta gratis, guardá lo que querés ver y dejá que Watchly decida por vos cuando no sepas qué poner.",
  },
} as const;

export function FeaturePromoPage({ kind }: { kind: keyof typeof FEATURES }) {
  const f = FEATURES[kind];
  usePageTitle(f.title, f.lead);
  const { items, hero, all } = useHeroItems();
  const Icon = f.icon;
  const pick = all.filter((i) => i.posterPath).slice(6, 9);

  return (
    <div className="min-h-screen text-white">
      <section className="relative min-h-[82svh] flex flex-col overflow-hidden">
        <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />
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
          {f.steps.map(({ icon: S, t, d }, i) => (
            <div key={t} className="liquid-glass rounded-[2rem] p-7">
              <div className="flex items-center justify-between">
                <span className="liquid-glass-sm w-12 h-12 rounded-full flex items-center justify-center"><S className="w-5 h-5" /></span>
                {kind === "adn" && <span className="font-cinema text-4xl text-white/30">{String(i + 1).padStart(2, "0")}</span>}
              </div>
              <h3 className="font-cinema text-3xl leading-tight mt-5">{t}</h3>
              <p className="text-sm text-white/75 mt-2 leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {f.preview ? (
        <section className="px-5 md:px-14 pb-20">
          <div className="liquid-menu max-w-[900px] mx-auto rounded-[2.5rem] p-8 md:p-10" style={{ transformOrigin: "center" }}>
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
        </section>
      ) : pick.length > 0 && (
        <section className="px-5 md:px-14 pb-20">
          <div className="liquid-menu max-w-[900px] mx-auto rounded-[2.5rem] p-8 md:p-10 text-center" style={{ transformOrigin: "center" }}>
            <p className="text-xs font-extrabold tracking-[.2em] uppercase text-white/70">Ejemplo · Modo «Sorprendeme»</p>
            <div className="flex justify-center items-end gap-4 mt-7">
              {pick.map((p, i) => (
                <img key={p.tmdbId} src={getPosterUrl(p.posterPath, "w342")} alt={p.title}
                  className={`aspect-[2/3] object-cover rounded-2xl border border-white/20 shadow-[0_24px_50px_rgba(0,0,0,.6)] ${i === 1 ? "w-36 md:w-44" : "w-24 md:w-32 opacity-50"}`}
                  style={{ transform: i === 1 ? "none" : `rotate(${i === 0 ? -6 : 6}deg)` }} />
              ))}
            </div>
            <p className="font-cinema text-3xl md:text-4xl mt-7">Hoy toca: {pick[1]?.title}</p>
            <p className="text-sm text-white/70 mt-2">Elegida entre tus pendientes. ¿No te convence? Tocá otra vez.</p>
          </div>
        </section>
      )}

      <SignupCta title={f.ctaTitle} text={f.ctaText} />
      <PublicFooter items={items} index={hero.index} />
    </div>
  );
}
