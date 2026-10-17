import "@/styles/cinema.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { Link } from "react-router-dom";
import {
  HelpCircle, Plus, Info, Check, Shuffle, Dna, Layers, Compass, Bookmark, Play, CheckCheck, Star, RotateCw,
} from "lucide-react";
import { useInfiniteTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import HorizontalCarousel from "@/components/media/HorizontalCarousel";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import HelpGuideModal from "@/components/home/HelpGuideModal";
import { addToLibrary, getUserLibrary } from "@/services/library";
import { getUserLists, getList } from "@/services/lists";
import { getBackdropUrl, getPosterUrl, getDnaRecommendations } from "@/services/tmdb";
import { getMyDna } from "@/services/dna";
import { getTasteProfile } from "@/services/taste";
import { explainTaste, tasteScore } from "@/lib/tasteProfile";
import { genreLabel } from "@/lib/genres";
import type { TMDBSearchResult, Entry, List, MediaType } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const label = "text-xs font-extrabold uppercase tracking-widest text-white/60";

export default function HomePage() {
  usePageTitle("Inicio | Watchly");
  const { user, profile } = useAuth();
  const name = profile?.display_name || user?.email?.split("@")[0] || "usuario";
  const trendingInf = useInfiniteTrending("all");
  const moviesInf = useInfiniteTrending("movie");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [listPosters, setListPosters] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const [recReasons, setRecReasons] = useState<Record<string, string>>({});
  const [recs, setRecs] = useState<TMDBSearchResult[]>([]);
  const [recGenres, setRecGenres] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyDna(user.id)
      .then(async (dna) => {
        if (!dna || dna.topGenres.length === 0) return;
        const library = await getUserLibrary(user.id);
        const taste = await getTasteProfile(library, dna.topGenres);
        if (!taste.genres.length) return;
        const items = (await getDnaRecommendations(taste.genres.map((g) => g.key), dna.formatDistribution)).sort((a, b) => tasteScore(b, taste) - tasteScore(a, taste));
        if (cancelled) return;
        setRecGenres(dna.topGenres.slice(0, 3).map((g) => g.label));
        setRecReasons(Object.fromEntries(items.map((item) => [`${item.mediaType}-${item.tmdbId}`, explainTaste(item, taste)])));
        setRecs(items);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [user]);

  const refresh = () => { if (user) getUserLibrary(user.id).then(setEntries).catch(console.error); };

  useEffect(() => {
    if (!user) return;
    refresh();
    getUserLists(user.id).then(setLists).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (lists.length === 0) return;
    let cancelled = false;
    (async () => {
      const data: Record<string, string[]> = {};
      await Promise.all(lists.slice(0, 3).map(async (l) => {
        try {
          const { items } = await getList(l.id);
          data[l.id] = items.filter((i) => i.poster_path).slice(0, 4).map((i) => i.poster_path as string);
        } catch { data[l.id] = []; }
      }));
      if (!cancelled) setListPosters(data);
    })();
    return () => { cancelled = true; };
  }, [lists]);

  const isInLibrary = (item: TMDBSearchResult) => entries.some((e) => e.tmdb_id === item.tmdbId && e.media_type === item.mediaType);
  const trending = trendingInf.items.filter((i) => !isInLibrary(i));
  const movies = moviesInf.items.filter((i) => !isInLibrary(i));
  const forYou = recs.filter((i) => !isInLibrary(i));

  const heroItems = useMemo(
    () => trending.filter((i) => i.posterPath && i.backdropPath && i.overview).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trendingInf.items, entries],
  );
  const hero = useHeroCycle(heroItems.map((i) => i.posterPath));

  const watching = entries.filter((e) => e.status === "watching");
  const pending = entries.filter((e) => e.status === "want_to_watch");
  const completed = entries.filter((e) => e.status === "completed");
  const favorites = entries.filter((e) => (e.rating ?? 0) >= 4);
  const recent = entries.slice(0, 12);
  const total = Math.max(entries.length, 1);
  const pc = (n: number) => (n / total) * 100;
  const cDone = pc(completed.length), cWatch = cDone + pc(watching.length), cPend = cWatch + pc(pending.length);
  const donut = entries.length ? `hsl(210 90% 72%) 0 ${cDone}%, hsl(145 70% 62%) ${cDone}% ${cWatch}%, hsl(265 90% 78%) ${cWatch}% ${cPend}%, rgba(255,255,255,.14) ${cPend}% 100%` : "rgba(255,255,255,.14) 0 100%";
  const cineStats = [
    { icon: CheckCheck, l: "Vistas", v: completed.length, c: "hsl(210 90% 72%)" },
    { icon: Play, l: "Viendo", v: watching.length, c: "hsl(145 70% 62%)" },
    { icon: Bookmark, l: "Por ver", v: pending.length, c: "hsl(265 90% 78%)" },
    { icon: Star, l: "Favoritas", v: favorites.length, c: "hsl(45 95% 68%)" },
  ];
  const bannerPosters = useMemo(() => {
    const own = [...entries].filter((e) => e.poster_path).sort(() => 0.5 - Math.random()).slice(0, 5).map((e) => e.poster_path as string);
    return own.length >= 3 ? own : [...own, ...heroItems.map((i) => i.posterPath as string)].slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, heroItems]);

  const toResult = (e: Entry): TMDBSearchResult => ({
    tmdbId: e.tmdb_id, mediaType: e.media_type, title: e.title, originalTitle: e.title,
    overview: "", year: null, releaseDate: null, posterPath: e.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
  });

  const quickAdd = async (item: TMDBSearchResult) => {
    if (!user || adding) return;
    const key = `${item.mediaType}-${item.tmdbId}`;
    setAdding(key);
    try {
      await addToLibrary(user.id, {
        tmdbId: item.tmdbId, mediaType: item.mediaType as MediaType, title: item.title, posterPath: item.posterPath,
        status: "want_to_watch", rating: null, description: item.overview || undefined,
      });
      setJustAdded(key);
      setTimeout(() => setJustAdded(null), 1800);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(null);
    }
  };

  const accent = { color: "#fff" } as const;
  const whiteBtn = "inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60";
  const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]";

  return (
    <div className="w-full text-white">
      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[88svh] flex flex-col overflow-hidden">
        <HeroBackdrop soft items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        <div className="relative z-10 flex-1 flex items-center px-4 md:px-8 pt-24 pb-8">
          {heroItems.length > 0 ? (
            <div className="grid max-w-3xl">
              {heroItems.map((it, i) => {
                const key = `${it.mediaType}-${it.tmdbId}`;
                const on = i === hero.index;
                return (
                  <div key={key} className="[grid-area:1/1] transition-all duration-1000"
                    style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 18}px)`, pointerEvents: on ? "auto" : "none" }}>
                    <p className="text-sm font-extrabold text-white/80 mb-4">Hola, <span style={accent}>{name}</span> · esto es tendencia esta semana</p>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {it.year && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{it.year}</span>}
                      <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{it.mediaType === "movie" ? "Película" : "Serie"}</span>
                      {genreLabel(it.genreIds) && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-bold">{genreLabel(it.genreIds)}</span>}
                      {it.tmdbRating ? (
                        <span className="px-4 py-2 rounded-full text-xs font-extrabold text-[#111]" style={{ background: hero.accent, transition: "background 1.2s" }}>★ {it.tmdbRating.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <h1 className="font-cinema mt-6 mb-5 text-5xl md:text-7xl xl:text-[7rem] leading-[1.02] line-clamp-3 drop-shadow-[0_10px_60px_rgba(0,0,0,.5)]">{it.title}</h1>
                    <p className="text-base md:text-lg leading-relaxed font-medium text-white/85 max-w-xl line-clamp-3 text-pretty">{it.overview}</p>
                    <div className="flex flex-wrap gap-3 mt-8">
                      <button type="button" onClick={() => setSelected(it)} className={whiteBtn}><Info className="w-5 h-5" /> Ver detalles</button>
                      <button type="button" onClick={() => quickAdd(it)} disabled={adding === key} className={glassBtn} style={{ background: hero.accentGlass }}>
                        {adding === key ? <RotateCw className="w-5 h-5 animate-spin" /> : justAdded === key ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {justAdded === key ? "¡Agregada a Por ver!" : "Quiero verla"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <h1 className="font-cinema text-6xl md:text-8xl">Hola, <span style={accent}>{name}</span></h1>
          )}
        </div>

        <div className="relative z-10 flex items-end gap-3.5 overflow-x-auto no-scrollbar px-4 md:px-8 pb-16 pt-2">
          {heroItems.map((it, i) => {
            const on = i === hero.index;
            return (
              <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => hero.select(i)} aria-label={it.title}
                className="shrink-0 flex flex-col gap-2.5 transition-all duration-700" style={{ width: on ? 118 : 82 }}>
                <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} className="w-full object-cover rounded-[1.1rem] transition-all duration-700"
                  style={{ aspectRatio: "2/3", border: `1px solid rgba(255,255,255,${on ? 0.6 : 0.18})`, boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${on ? 2 : 0}px ${hero.accent}` }} />
                <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                  <span key={hero.cycle} className="block h-full hero-progress" style={{ animationDuration: `${hero.duration}ms`, background: hero.accent }} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="relative px-4 md:px-6 pb-24 -mt-10 space-y-14">
        <div className="flex items-stretch">
          <Link to="/que-vemos-hoy" className="group relative flex-1 min-h-[168px] overflow-hidden rounded-[2rem] border border-white/20 flex items-center transition-transform hover:scale-[1.005]"
            style={{ background: `radial-gradient(120% 160% at 100% 50%, color-mix(in srgb, ${hero.accent} 55%, transparent), transparent 62%), linear-gradient(105deg, color-mix(in srgb, ${hero.accent} 28%, #0d0b16) 0%, #0d0b16 70%)`, transition: "background 1.2s", boxShadow: `0 24px 70px -20px color-mix(in srgb, ${hero.accent} 60%, transparent)` }}>
            <div className="relative z-10 flex-1 min-w-0 p-6 md:p-8">
              <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/80"><span className="w-1.5 h-1.5 rounded-full" style={{ background: hero.accent }} />Tu plan empieza acá</span>
              <span className="block font-cinema text-4xl md:text-6xl leading-none mt-2">¿Qué vemos hoy?</span>
              <span className="block text-sm md:text-base text-white/80 mt-2 max-w-md">Elegimos entre lo que ya guardaste en tu biblioteca.</span>
              <span className="flex flex-wrap items-center gap-2 mt-4">
                {["Algo rápido", "Quiero reírme", "Sorprendeme"].map((m) => <span key={m} className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-xs font-bold">{m}</span>)}
                <span className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-[#111] text-sm font-extrabold ml-1 group-hover:gap-3 transition-all"><Shuffle size={16} />Armar mi plan →</span>
              </span>
            </div>
            <div className="hidden md:block relative self-stretch w-[46%] max-w-[560px] transition-transform duration-500 group-hover:scale-[1.04]" aria-hidden="true">
              {bannerPosters.map((p, i) => {
                const n = bannerPosters.length, mid = (n - 1) / 2, d = i - mid;
                return <img key={p + i} src={getPosterUrl(p, "w342")} alt="" loading="lazy" className="absolute top-1/2 h-[128%] aspect-[2/3] object-cover rounded-xl border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,.55)]"
                  style={{ left: `calc(50% + ${d * 20}% - 62px)`, transform: `translateY(-46%) rotate(${d * 7}deg)`, zIndex: 10 - Math.abs(Math.round(d)) }} />;
              })}
            </div>
            <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none bg-gradient-to-r from-[#0d0b16]/40 to-transparent" />
          </Link>
        </div>

        {/* ───────── PANEL PERSONAL ───────── */}
        <section className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
          <div className="liquid-glass rounded-[2.25rem] p-7 flex flex-col">
            <div className="flex items-center justify-between gap-3"><p className={label}>Tu cine</p><button type="button" onClick={() => setShowHelp(true)} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-[11px] font-extrabold text-white/80 hover:text-white hover:border-white/50 transition-colors"><HelpCircle className="w-3.5 h-3.5" />Guía de uso</button></div>
            <div className="flex items-center gap-7 mt-5 flex-1">
              <div className="relative shrink-0 w-[144px] h-[144px] rounded-full" style={{ background: `conic-gradient(${donut})` }}>
                <div className="absolute inset-[14px] rounded-full bg-[#14121f] flex flex-col items-center justify-center">
                  <span className="font-cinema text-5xl leading-none">{entries.length}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60 mt-1">títulos</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-4 flex-1 min-w-0">
                {cineStats.map(({ icon: Icon, l, v, c }) => (
                  <div key={l} className="min-w-0">
                    <p className="font-cinema text-4xl leading-none">{v}</p>
                    <p className="flex items-center gap-1.5 text-[11px] font-extrabold mt-1.5 text-white/75"><Icon className="w-3.5 h-3.5 shrink-0" style={{ color: c }} />{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs mt-5 text-white/60">{lists.length} {lists.length === 1 ? "lista" : "listas"} creadas</p>
          </div>

          <div className="relative liquid-glass rounded-[2.25rem] overflow-hidden p-7 flex flex-col min-h-[280px]">
            {(watching[0] ?? pending[0])?.poster_path && <img src={getPosterUrl((watching[0] ?? pending[0]).poster_path, "w342")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b16]/90 via-[#0d0b16]/40 to-transparent" />
            <div className="relative flex items-center justify-between">
              <p className={label}>Seguí donde quedaste</p>
              <Link to="/biblioteca" className="text-xs font-extrabold text-white hover:opacity-80">Ver todo →</Link>
            </div>
            {watching.length > 0 ? (
              <div className="relative mt-auto pt-6 flex items-end gap-5">
                <button type="button" onClick={() => setSelected(toResult(watching[0]))} className="shrink-0 w-[112px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,.6)]">
                  <img src={getPosterUrl(watching[0].poster_path, "w342")} alt={watching[0].title} className="w-full h-full object-cover" />
                </button>
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">{watching[0].media_type === "movie" ? "Película" : "Serie"} · Viendo</p>
                  <p className="font-cinema text-3xl leading-tight mt-1 line-clamp-2">{watching[0].title}</p>
                  <button type="button" onClick={() => setSelected(toResult(watching[0]))} className="mt-3 inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-[#111] text-sm font-extrabold"><Play className="w-4 h-4" />Continuar</button>
                  {watching.length > 1 && <div className="flex -space-x-2 mt-3">{watching.slice(1, 5).map((e) => <img key={e.id} src={getPosterUrl(e.poster_path, "w200")} alt={e.title} title={e.title} className="w-8 h-8 rounded-full object-cover border-2 border-[#14121f]" />)}<span className="pl-3 text-[11px] font-bold text-white/70 self-center">{watching.length - 1} más en curso</span></div>}
                </div>
              </div>
            ) : (
              <p className="relative mt-auto text-sm text-white/80 leading-relaxed max-w-[16rem]">Nada en curso. Marcá un título como “Viendo” y aparece acá.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/que-vemos-hoy", icon: Shuffle, title: "¿Qué vemos hoy?", sub: "Un plan desde tu biblioteca", h: 265 },
              { to: "/buscar", icon: Compass, title: "Descubrir", sub: "Títulos nuevos", h: 200 },
              { to: "/listas", icon: Layers, title: "Mis listas", sub: `${lists.length} creadas`, h: 335 },
              { to: "/adn", icon: Dna, title: "Mi ADN", sub: "Tus gustos", h: 150 },
            ].map(({ to, icon: Icon, title, sub, h }) => (
              <Link key={to} to={to} className="group relative overflow-hidden rounded-[1.75rem] p-4 min-h-[132px] flex flex-col justify-between border border-white/15 text-white hover:text-white hover:border-white/40 transition-colors"
                style={{ background: `linear-gradient(150deg, hsl(${h} 70% 55% / .38), hsl(${h} 60% 30% / .18) 70%)` }}>
                <Icon className="absolute -right-3 -bottom-3 w-20 h-20 opacity-15 rotate-[-12deg] transition-transform duration-500 group-hover:rotate-0" />
                <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <span className="relative"><span className="block text-sm font-extrabold leading-tight">{title}</span><span className="block text-[11px] text-white/75 mt-0.5">{sub}</span></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ───────── POR VER ───────── */}
        {pending.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="font-cinema text-4xl md:text-6xl leading-none">Tu lista para ver</h2>
                <p className="text-sm mt-2 text-white/65">{pending.length} pendientes · ¿no sabés cuál elegir?</p>
              </div>
              <Link to="/que-vemos-hoy" className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-extrabold text-white hover:scale-[1.03] transition-transform">
                <Shuffle className="w-4 h-4" style={accent} /> Elegir por mí
              </Link>
            </div>
            <HorizontalCarousel className="gap-5 pt-2 pb-6">
              {pending.map((e) => (
                <button key={e.id} type="button" onClick={() => setSelected(toResult(e))} className="group w-[170px] md:w-[200px] shrink-0 snap-start text-left">
                  <div className="relative aspect-[2/3] rounded-[1.6rem] overflow-hidden border border-white/15 shadow-[0_24px_50px_-14px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={getPosterUrl(e.poster_path, "w342")} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="liquid-glass-sm absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center"><Bookmark className="w-4 h-4" style={accent} /></span>
                  </div>
                  <p className="mt-3 px-1 text-sm font-extrabold truncate">{e.title}</p>
                </button>
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── RECIENTES ───────── */}
        {recent.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="font-cinema text-4xl md:text-6xl leading-none">Agregadas recientemente</h2>
              <Link to="/biblioteca" className="text-sm font-extrabold hover:opacity-80" style={accent}>Biblioteca →</Link>
            </div>
            <HorizontalCarousel className="gap-4 pt-2 pb-6">
              {recent.map((e) => (
                <button key={e.id} type="button" onClick={() => setSelected(toResult(e))} title={e.title}
                  className="group relative w-[130px] md:w-[150px] shrink-0 snap-start aspect-[2/3] rounded-[1.4rem] overflow-hidden border border-white/15 shadow-[0_20px_44px_-16px_rgba(0,0,0,.7)] transition-transform duration-500 hover:-translate-y-1.5">
                  <img src={getPosterUrl(e.poster_path, "w342")} alt={e.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,.85))" }} />
                  <p className="absolute left-2.5 right-2.5 bottom-2.5 text-[11px] font-extrabold leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity text-left">{e.title}</p>
                </button>
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── PARA VOS (ADN) ───────── */}
        {forYou.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="font-cinema text-4xl md:text-6xl leading-none">Para vos, según tu ADN</h2>
                <p className="text-sm mt-2 text-white/65">Películas y series de {recGenres.join(", ")}</p>
              </div>
              <Link to="/adn" className="text-sm font-extrabold hover:opacity-80" style={accent}>Mi ADN →</Link>
            </div>
            <HorizontalCarousel className="gap-5 pt-2 pb-6">
              {forYou.map((it) => {
                const key = `${it.mediaType}-${it.tmdbId}`;
                return (
                  <div key={key} className="group relative w-[170px] md:w-[200px] shrink-0 snap-start">
                    <button type="button" onClick={() => setSelected(it)} className="w-full text-left">
                      <div className="relative aspect-[2/3] rounded-[1.6rem] overflow-hidden border border-white/15 shadow-[0_24px_50px_-14px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:-translate-y-2">
                        <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <span className="liquid-glass-sm absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">{it.mediaType === "movie" ? "Película" : "Serie"}</span>
                        {it.tmdbRating ? <span className="liquid-glass-sm absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">★ {it.tmdbRating.toFixed(1)}</span> : null}
                      </div>
                      <p className="mt-3 px-1 text-sm font-extrabold truncate">{it.title}</p>
                      <p className="px-1 mt-2 text-xs text-violet-200 leading-relaxed">Por qué: {recReasons[`${it.mediaType}-${it.tmdbId}`]}</p>
                      <p className="px-1 text-xs text-white/60">{genreLabel(it.genreIds) || (it.year ?? "")}</p>
                    </button>
                    <button type="button" onClick={() => quickAdd(it)} disabled={adding === key} title="Agregar a Por ver"
                      className="liquid-glass-sm absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                      {adding === key ? <RotateCw className="w-4 h-4 animate-spin" /> : justAdded === key ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── TENDENCIA ───────── */}
        {trending.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <h2 className="font-cinema text-4xl md:text-6xl leading-none mb-5">Tendencia de la semana</h2>
            <HorizontalCarousel className="gap-6 pt-2 pb-6" onLoadMore={trendingInf.hasMore ? trendingInf.loadMore : undefined} loadingMore={trendingInf.loading}>
              {trending.map((it) => (
                <WideCard key={`${it.mediaType}-${it.tmdbId}`} item={it} onClick={() => setSelected(it)} onAdd={() => quickAdd(it)}
                  busy={adding === `${it.mediaType}-${it.tmdbId}`} done={justAdded === `${it.mediaType}-${it.tmdbId}`} className="w-[82vw] max-w-[400px] md:w-[520px] md:max-w-none" />
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── POPULARES ───────── */}
        {movies.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <h2 className="font-cinema text-4xl md:text-6xl leading-none mb-5">Películas populares</h2>
            <HorizontalCarousel className="gap-5 pt-2 pb-6" onLoadMore={moviesInf.hasMore ? moviesInf.loadMore : undefined} loadingMore={moviesInf.loading}>
              {movies.map((it) => (
                <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => setSelected(it)} className="group w-[170px] md:w-[200px] shrink-0 snap-start text-left">
                  <div className="relative aspect-[2/3] rounded-[1.6rem] overflow-hidden border border-white/15 shadow-[0_24px_50px_-14px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {it.tmdbRating ? <span className="liquid-glass-sm absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">★ {it.tmdbRating.toFixed(1)}</span> : null}
                  </div>
                  <p className="mt-3 px-1 text-sm font-extrabold truncate">{it.title}</p>
                  <p className="px-1 text-xs text-white/60">{it.year ?? ""}</p>
                </button>
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── LISTAS ───────── */}
        {lists.length > 0 && (
          <section className="border-t border-white/20 pt-6">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="font-cinema text-4xl md:text-6xl leading-none">Tus listas</h2>
              <Link to="/listas" className="text-sm font-extrabold hover:opacity-80" style={accent}>Ver todas →</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {lists.slice(0, 3).map((l) => {
                const posters = listPosters[l.id] ?? [];
                return (
                  <Link key={l.id} to={`/listas/${l.id}`} className="group relative h-56 rounded-[2.25rem] overflow-hidden border border-white/18 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] text-white hover:text-white transition-transform duration-500 hover:-translate-y-1.5"
                    style={{ background: "linear-gradient(160deg, var(--accent-soft), rgba(20,20,32,.9))" }}>
                    {posters.length > 0 && (
                      <div className="absolute inset-0 grid h-full w-full" style={{ gridTemplateColumns: `repeat(${posters.length}, 1fr)` }}>
                        {posters.map((p, i) => <img key={i} src={getPosterUrl(p, "w342")} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />)}
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.2), transparent 40%, rgba(7,7,13,.55))" }} />
                    <div className="liquid-glass absolute left-3.5 right-3.5 bottom-3.5 rounded-[1.5rem] px-5 py-3.5">
                      <p className="font-cinema text-3xl leading-none truncate">{l.name}</p>
                      {l.description && <p className="text-xs mt-1.5 line-clamp-1 text-white/75">{l.description}</p>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {selected && (
        <MediaDetailModal result={selected} onClose={() => setSelected(null)} onSaved={refresh} />
      )}
      {showHelp && <HelpGuideModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function WideCard({ item, onClick, onAdd, busy, done, className }: {
  item: TMDBSearchResult; onClick: () => void; onAdd: () => void; busy: boolean; done: boolean; className: string;
}) {
  const src = item.backdropPath ? getBackdropUrl(item.backdropPath, "w780") : getPosterUrl(item.posterPath, "w500");
  return (
    <div className={`group relative shrink-0 snap-start aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/18 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] ${className}`}>
      <button type="button" onClick={onClick} className="absolute inset-0 text-left" aria-label={item.title}>
        <img src={src} alt={item.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={item.backdropPath ? undefined : { filter: "blur(18px)", transform: "scale(1.3)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,.7))" }} />
        <div className="liquid-glass absolute left-3.5 right-3.5 bottom-3.5 rounded-3xl px-5 py-4">
          <div className="flex items-center gap-3">
            <p className="font-cinema text-2xl md:text-3xl leading-none truncate">{item.title}</p>
            {item.tmdbRating ? <span className="ml-auto shrink-0 px-3 py-1 rounded-full bg-white text-[#111] text-xs font-extrabold">★ {item.tmdbRating.toFixed(1)}</span> : null}
          </div>
          {item.overview && <p className="text-[13px] leading-snug mt-2 text-white/85 line-clamp-2">{item.overview}</p>}
        </div>
      </button>
      <button type="button" onClick={onAdd} disabled={busy} title="Agregar a Por ver"
        className="liquid-glass-sm absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
        {busy ? <RotateCw className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}
