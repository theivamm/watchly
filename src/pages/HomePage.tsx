import "@/styles/cinema.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { Link } from "react-router-dom";
import {
  Search, HelpCircle, Plus, Info, Check, Shuffle, Dna, Layers, Compass, Bookmark, Play, CheckCheck, Star, RotateCw,
} from "lucide-react";
import { useInfiniteTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import HorizontalCarousel from "@/components/media/HorizontalCarousel";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import HelpGuideModal from "@/components/home/HelpGuideModal";
import { addToLibrary, getUserLibrary } from "@/services/library";
import { getUserLists, getList } from "@/services/lists";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
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

  const pickRandom = () => {
    if (pending.length === 0) return;
    setSelected(toResult(pending[Math.floor(Math.random() * pending.length)]));
  };

  const stats = [
    { icon: Bookmark, label: "Por ver", value: pending.length },
    { icon: Play, label: "Viendo", value: watching.length },
    { icon: CheckCheck, label: "Vistas", value: completed.length },
    { icon: Star, label: "Favoritas", value: favorites.length },
  ];
  const accent = { color: hero.accent, transition: "color 1.2s" } as const;
  const whiteBtn = "inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60";
  const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]";

  return (
    <div className="w-full text-white">
      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[88svh] flex flex-col overflow-hidden">
        <HeroBackdrop soft items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        <div className="relative z-10 flex items-center gap-3 px-5 md:px-10 pt-6">
          <Link to="/buscar" className="liquid-glass flex-1 max-w-md h-12 rounded-full flex items-center gap-3 px-5 text-sm text-white/75 hover:text-white transition-colors">
            <Search className="w-4 h-4" /> Buscar película o serie…
          </Link>
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Guía de uso" className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 flex-1 flex items-center px-5 md:px-14 py-8">
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

        <div className="relative z-10 flex items-end gap-3.5 overflow-x-auto no-scrollbar px-5 md:px-14 pb-16 pt-2">
          {heroItems.map((it, i) => {
            const on = i === hero.index;
            return (
              <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => hero.select(i)} aria-label={it.title}
                className="shrink-0 flex flex-col gap-2.5 transition-all duration-700" style={{ width: on ? 118 : 82 }}>
                <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} className="w-full object-cover rounded-[1.1rem] transition-all duration-700"
                  style={{ aspectRatio: "2/3", border: `1px solid rgba(255,255,255,${on ? 0.6 : 0.18})`, boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${on ? 2 : 0}px ${hero.accent}` }} />
                <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                  <span className="block h-full" style={{ width: `${hero.progress}%`, background: hero.accent }} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="relative px-5 md:px-14 pb-24 -mt-10 space-y-14">
        {/* ───────── PANEL PERSONAL ───────── */}
        <section className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]">
          <div className="liquid-glass rounded-[2.25rem] p-7">
            <p className={label}>Tu cine</p>
            <div className="grid grid-cols-4 gap-3 mt-5">
              {stats.map(({ icon: Icon, label: l, value }) => (
                <div key={l}>
                  <Icon className="w-4 h-4 text-white/55 mb-2" />
                  <p className="font-cinema text-5xl leading-none" style={accent}>{value}</p>
                  <p className="text-[11px] font-extrabold mt-2 text-white/75">{l}</p>
                </div>
              ))}
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-white/10 mt-6">
              {[{ n: completed.length, c: "hsl(210 90% 72%)" }, { n: watching.length, c: "hsl(145 70% 65%)" }, { n: pending.length, c: "hsl(265 90% 78%)" }]
                .filter((s) => s.n > 0).map((s, i) => <div key={i} style={{ width: `${(s.n / Math.max(entries.length, 1)) * 100}%`, background: s.c }} />)}
            </div>
            <p className="text-xs mt-3 text-white/60">{entries.length} títulos en tu biblioteca · {lists.length} {lists.length === 1 ? "lista" : "listas"}</p>
          </div>

          <div className="liquid-glass rounded-[2.25rem] p-7">
            <div className="flex items-center justify-between">
              <p className={label}>Seguí donde quedaste</p>
              <Link to="/biblioteca" className="text-xs font-extrabold hover:opacity-80" style={accent}>Ver todo →</Link>
            </div>
            {watching.length > 0 ? (
              <div className="mt-5 flex flex-col gap-3">
                {watching.slice(0, 3).map((e) => (
                  <button key={e.id} type="button" onClick={() => setSelected(toResult(e))} className="flex items-center gap-4 text-left rounded-[1.25rem] p-1.5 hover:bg-white/10 transition-colors">
                    <img src={getPosterUrl(e.poster_path, "w200")} alt={e.title} className="w-11 aspect-[2/3] object-cover rounded-xl" />
                    <div className="min-w-0"><p className="text-sm font-extrabold truncate">{e.title}</p><p className="text-[11px] text-white/60">{e.media_type === "movie" ? "Película" : "Serie"} · Viendo</p></div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-white/70 leading-relaxed">Nada en curso. Marcá un título como “Viendo” y aparece acá.</p>
            )}
          </div>

          <div className="liquid-glass rounded-[2.25rem] p-4 flex flex-col gap-2">
            {[
              { to: "/buscar", icon: Compass, title: "Descubrir", sub: "Buscá títulos nuevos" },
              { to: "/listas", icon: Layers, title: "Mis listas", sub: `${lists.length} creadas` },
              { to: "/adn", icon: Dna, title: "Mi ADN", sub: "Tus gustos, resumidos" },
            ].map(({ to, icon: Icon, title, sub }) => (
              <Link key={to} to={to} className="flex items-center gap-4 rounded-[1.5rem] px-4 py-3 text-white hover:text-white hover:bg-white/10 transition-colors">
                <span className="liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center"><Icon className="w-5 h-5" style={accent} /></span>
                <span className="min-w-0"><span className="block text-sm font-extrabold">{title}</span><span className="block text-[11px] text-white/60">{sub}</span></span>
              </Link>
            ))}
          </div>
        </section>

        {/* ───────── POR VER ───────── */}
        {pending.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="font-cinema text-4xl md:text-5xl leading-none">Tu lista para ver</h2>
                <p className="text-sm mt-2 text-white/65">{pending.length} pendientes · ¿no sabés cuál elegir?</p>
              </div>
              <button type="button" onClick={pickRandom} className="liquid-glass-sm inline-flex items-center gap-2 h-12 px-6 rounded-full text-sm font-extrabold text-white hover:scale-[1.03] transition-transform">
                <Shuffle className="w-4 h-4" style={accent} /> Elegir por mí
              </button>
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
          <section>
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="font-cinema text-4xl md:text-5xl leading-none">Agregadas recientemente</h2>
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

        {/* ───────── TENDENCIA ───────── */}
        {trending.length > 0 && (
          <section>
            <h2 className="font-cinema text-4xl md:text-5xl leading-none mb-5">Tendencia de la semana</h2>
            <HorizontalCarousel className="gap-6 pt-2 pb-6" onLoadMore={trendingInf.hasMore ? trendingInf.loadMore : undefined} loadingMore={trendingInf.loading}>
              {trending.map((it) => (
                <WideCard key={`${it.mediaType}-${it.tmdbId}`} item={it} onClick={() => setSelected(it)} onAdd={() => quickAdd(it)}
                  busy={adding === `${it.mediaType}-${it.tmdbId}`} done={justAdded === `${it.mediaType}-${it.tmdbId}`} className="w-[400px] md:w-[520px]" />
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {/* ───────── POPULARES ───────── */}
        {movies.length > 0 && (
          <section>
            <h2 className="font-cinema text-4xl md:text-5xl leading-none mb-5">Películas populares</h2>
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
          <section>
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="font-cinema text-4xl md:text-5xl leading-none">Tus listas</h2>
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
