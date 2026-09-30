import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { Link } from "react-router-dom";
import { Search, HelpCircle, Plus, Info } from "lucide-react";
import { useInfiniteTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import HorizontalCarousel from "@/components/media/HorizontalCarousel";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import HelpGuideModal from "@/components/home/HelpGuideModal";
import { getUserLibrary } from "@/services/library";
import { getUserLists } from "@/services/lists";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { genreLabel } from "@/lib/genres";
import type { TMDBSearchResult, Entry, EntryStatus } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_LABELS: Record<EntryStatus, string> = {
  want_to_watch: "Quiero ver",
  watching: "Viendo",
  completed: "Completado",
  paused: "Pausado",
  dropped: "Abandonado",
};

export default function HomePage() {
  usePageTitle("Inicio | Watchly");
  const { user, profile } = useAuth();
  const name = profile?.display_name || user?.email?.split("@")[0] || "usuario";
  const trendingInf = useInfiniteTrending("all");
  const moviesInf = useInfiniteTrending("movie");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [listsCount, setListsCount] = useState(0);
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const [recentLimit, setRecentLimit] = useState(10);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserLibrary(user.id).then(setEntries).catch(console.error);
    getUserLists(user.id).then((l) => setListsCount(l.length)).catch(console.error);
  }, [user]);

  const isInLibrary = (item: TMDBSearchResult) =>
    entries.some((e) => e.tmdb_id === item.tmdbId && e.media_type === item.mediaType);
  const trending = trendingInf.items.filter((i) => !isInLibrary(i));
  const movies = moviesInf.items.filter((i) => !isInLibrary(i));

  const heroItems = useMemo(
    () => trending.filter((i) => i.posterPath && i.overview).slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trendingInf.items, entries],
  );
  const hero = useHeroCycle(heroItems.map((i) => i.posterPath));

  const stats = useMemo(() => [
    { label: "Películas", value: entries.filter((e) => e.media_type === "movie").length },
    { label: "Series", value: entries.filter((e) => e.media_type === "tv").length },
    { label: "Favoritas", value: entries.filter((e) => (e.rating ?? 0) >= 4).length },
    { label: "Listas", value: listsCount },
  ], [entries, listsCount]);

  const recentEntries = entries.slice(0, recentLimit);
  const openEntry = (e: Entry) =>
    setSelected({
      tmdbId: e.tmdb_id, mediaType: e.media_type, title: e.title, originalTitle: e.title,
      overview: "", year: null, releaseDate: null, posterPath: e.poster_path, backdropPath: null,
      genreIds: [], tmdbRating: null,
    });

  const accentText = { color: hero.accent, transition: "color 1.2s" } as const;

  return (
    <div className="w-full text-white">
      {/* ───────── HERO ───────── */}
      <section className="relative min-h-[100svh] overflow-hidden flex flex-col">
        <HeroBackdrop items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

        {/* Top bar */}
        <div className="relative z-10 flex items-center gap-3 px-5 md:px-10 pt-6">
          <Link to="/buscar"
            className="liquid-glass flex-1 max-w-md h-12 rounded-full flex items-center gap-3 px-5 text-sm text-white/70 hover:text-white transition-colors">
            <Search className="w-4 h-4" /> Buscar película o serie…
          </Link>
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Guía de uso"
            className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Copy */}
        <div className="relative z-10 flex-1 flex items-center px-5 md:px-14 py-10">
          {heroItems.length > 0 ? (
            <div className="grid max-w-3xl">
              {heroItems.map((it, i) => (
                <div key={`${it.mediaType}-${it.tmdbId}`}
                  className="[grid-area:1/1] transition-all duration-1000"
                  style={{
                    opacity: i === hero.index ? 1 : 0,
                    transform: `translateY(${i === hero.index ? 0 : 18}px)`,
                    pointerEvents: i === hero.index ? "auto" : "none",
                  }}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="liquid-glass-sm px-4 py-2 rounded-full text-sm font-bold">Hola, {name}</span>
                    {it.year && <span className="liquid-glass-sm px-4 py-2 rounded-full text-sm font-bold">{it.year}</span>}
                    {genreLabel(it.genreIds) && (
                      <span className="liquid-glass-sm px-4 py-2 rounded-full text-sm font-semibold">{genreLabel(it.genreIds)}</span>
                    )}
                    {it.tmdbRating ? (
                      <span className="px-4 py-2 rounded-full text-sm font-extrabold text-[#111]"
                        style={{ background: hero.accent, transition: "background 1.2s" }}>
                        TMDB {it.tmdbRating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="font-cinema mt-7 mb-6 text-6xl md:text-8xl xl:text-[8.75rem] leading-[1.02] line-clamp-3 drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
                    {it.title}
                  </h1>
                  <p className="text-base md:text-xl leading-relaxed font-medium text-white/85 max-w-xl line-clamp-3 text-pretty">
                    {it.overview}
                  </p>
                  <div className="flex flex-wrap gap-3.5 mt-8">
                    <button type="button" onClick={() => setSelected(it)}
                      className="h-14 px-8 rounded-full bg-white text-[#111] font-extrabold flex items-center gap-2.5 shadow-[0_12px_40px_rgba(0,0,0,.35)] hover:scale-[1.03] transition-transform">
                      <Info className="w-5 h-5" /> Ver detalles
                    </button>
                    <button type="button" onClick={() => setSelected(it)}
                      className="liquid-glass-sm h-14 px-7 rounded-full font-bold flex items-center gap-2.5 hover:scale-[1.03] transition-all"
                      style={{ background: hero.accentGlass }}>
                      <Plus className="w-5 h-5" /> Agregar a mi biblioteca
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <h1 className="font-cinema text-6xl md:text-8xl">Hola, <span style={accentText}>{name}</span></h1>
          )}
        </div>

        {/* Rail + stats */}
        <div className="relative z-10 flex items-end justify-between gap-6 px-5 md:px-14 pb-10">
          <div className="flex items-end gap-3.5 overflow-x-auto no-scrollbar py-2">
            {heroItems.map((it, i) => {
              const active = i === hero.index;
              return (
                <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => hero.select(i)}
                  className="shrink-0 flex flex-col gap-2.5 transition-all duration-700"
                  style={{ width: active ? 132 : 92 }} aria-label={it.title}>
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title}
                    className="w-full object-cover rounded-[18px] transition-all duration-700"
                    style={{
                      aspectRatio: "2/3",
                      border: `1px solid rgba(255,255,255,${active ? 0.6 : 0.18})`,
                      boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${active ? 2 : 0}px ${hero.accent}`,
                    }} />
                  <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: active ? 1 : 0 }}>
                    <span className="block h-full" style={{ width: `${hero.progress}%`, background: hero.accent }} />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="liquid-glass hidden lg:flex rounded-[2rem] py-4 px-2 shrink-0">
            {stats.map((s, i) => (
              <div key={s.label} className="px-6 text-center" style={{ borderLeft: i ? "1px solid rgba(255,255,255,.12)" : "none" }}>
                <div className="font-cinema text-4xl leading-none" style={accentText}>{s.value}</div>
                <div className="text-xs font-bold mt-2 text-white/75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── ROWS ───────── */}
      <div className="relative px-5 md:px-14 pb-24 space-y-14 overflow-hidden">
        <div className="absolute top-0 left-[20%] w-[900px] h-[500px] rounded-full blur-[150px] opacity-50 cinema-drift-a pointer-events-none"
          style={{ background: hero.row, transition: "background 1.6s" }} />

        {recentEntries.length > 0 && (
          <section className="relative">
            <div className="flex items-baseline gap-4 mb-5">
              <h2 className="font-cinema text-3xl md:text-4xl">Recientes en tu biblioteca</h2>
              <Link to="/biblioteca" className="ml-auto text-sm font-bold hover:opacity-80" style={accentText}>Ver todo →</Link>
            </div>
            <HorizontalCarousel
              className="gap-5 pt-2 pb-6"
              onLoadMore={recentLimit < entries.length ? () => setRecentLimit((l) => Math.min(l + 8, entries.length)) : undefined}
            >
              {recentEntries.map((e) => (
                <button key={e.id} type="button" onClick={() => openEntry(e)}
                  className="group w-[170px] md:w-[210px] shrink-0 snap-start text-left">
                  <div className="relative aspect-[2/3] rounded-[1.6rem] overflow-hidden border border-white/15 shadow-[0_24px_50px_-12px_rgba(0,0,0,.7)] transition-transform duration-500 group-hover:-translate-y-2">
                    <img src={getPosterUrl(e.poster_path, "w342")} alt={e.title} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="liquid-glass-sm absolute top-3 left-3 px-3 py-1.5 rounded-full text-[11px] font-bold">
                      {STATUS_LABELS[e.status]}
                    </span>
                    {e.rating != null && (
                      <span className="absolute bottom-3 right-3 w-11 h-11 rounded-full flex items-center justify-center text-[#111] font-extrabold"
                        style={{ background: hero.accent, transition: "background 1.2s" }}>{e.rating}★</span>
                    )}
                  </div>
                  <p className="mt-3 px-1 font-bold truncate">{e.title}</p>
                </button>
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {trending.length > 0 && (
          <section className="relative">
            <h2 className="font-cinema text-3xl md:text-4xl mb-5">Tendencia de la semana</h2>
            <HorizontalCarousel
              className="gap-6 pt-2 pb-6"
              onLoadMore={trendingInf.hasMore ? trendingInf.loadMore : undefined}
              loadingMore={trendingInf.loading}
            >
              {trending.map((it) => (
                <WideCard key={`${it.mediaType}-${it.tmdbId}`} item={it} onClick={() => setSelected(it)} className="w-[420px] md:w-[560px]" />
              ))}
            </HorizontalCarousel>
          </section>
        )}

        {movies.length > 0 && (
          <section className="relative">
            <h2 className="font-cinema text-3xl md:text-4xl mb-5">Películas populares</h2>
            <HorizontalCarousel
              className="gap-5 pt-2 pb-6"
              onLoadMore={moviesInf.hasMore ? moviesInf.loadMore : undefined}
              loadingMore={moviesInf.loading}
            >
              {movies.map((it) => (
                <WideCard key={`${it.mediaType}-${it.tmdbId}`} item={it} onClick={() => setSelected(it)} className="w-[320px] md:w-[380px]" />
              ))}
            </HorizontalCarousel>
          </section>
        )}

        <section className="relative grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { to: "/listas", title: "Mis listas", desc: "Organizá títulos por tema o por mood" },
            { to: "/buscar", title: "Descubrir", desc: "Explorá películas y series nuevas" },
          ].map((a) => (
            <Link key={a.to} to={a.to}
              className="liquid-glass rounded-[2rem] p-8 flex items-center gap-4 transition-transform duration-300 hover:-translate-y-1">
              <div>
                <p className="font-cinema text-3xl">{a.title}</p>
                <p className="text-sm text-white/75 mt-1.5">{a.desc}</p>
              </div>
              <span className="ml-auto text-2xl" style={accentText}>→</span>
            </Link>
          ))}
        </section>
      </div>

      {selected && (
        <MediaDetailModal
          result={selected}
          onClose={() => setSelected(null)}
          onSaved={() => { if (user) getUserLibrary(user.id).then(setEntries).catch(console.error); }}
        />
      )}
      {showHelp && <HelpGuideModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function WideCard({ item, onClick, className }: { item: TMDBSearchResult; onClick: () => void; className: string }) {
  const src = item.backdropPath ? getBackdropUrl(item.backdropPath, "w780") : getPosterUrl(item.posterPath, "w500");
  return (
    <button type="button" onClick={onClick}
      className={`group relative shrink-0 snap-start aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/18 shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] text-left ${className}`}>
      <img src={src} alt={item.title} loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={item.backdropPath ? undefined : { filter: "blur(18px)", transform: "scale(1.3)" }} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,.7))" }} />
      <div className="liquid-glass absolute left-3.5 right-3.5 bottom-3.5 rounded-3xl px-5 py-4">
        <div className="flex items-center gap-3">
          <p className="font-cinema text-2xl md:text-3xl leading-none truncate">{item.title}</p>
          {item.tmdbRating ? (
            <span className="ml-auto shrink-0 px-3 py-1 rounded-full bg-white text-[#111] text-xs font-extrabold">★ {item.tmdbRating.toFixed(1)}</span>
          ) : null}
        </div>
        {item.overview && <p className="text-[13px] leading-snug mt-2 text-white/85 line-clamp-2">{item.overview}</p>}
      </div>
    </button>
  );
}
