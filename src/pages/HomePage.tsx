import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { Link } from "react-router-dom";
import { Search, BookOpen, List, Sparkles, TrendingUp, ChevronRight, Film, Clapperboard } from "lucide-react";
import { useInfiniteTrending } from "@/hooks/useMedia";
import HorizontalMediaCard from "@/components/media/HorizontalMediaCard";
import MediaCard from "@/components/media/MediaCard";
import HorizontalCarousel from "@/components/media/HorizontalCarousel";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import { getUserLibrary, removeFromLibrary } from "@/services/library";
import { getUserLists } from "@/services/lists";
import { getPosterUrl } from "@/services/tmdb";
import type { TMDBSearchResult, Entry } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function HomePage() {
  usePageTitle("Inicio | Watchly");
  const { user, profile } = useAuth();
  const name = profile?.display_name || user?.email?.split("@")[0] || "usuario";
  const trendingInf = useInfiniteTrending("all");
  const moviesInf = useInfiniteTrending("movie");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [listsCount, setListsCount] = useState(0);
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const [bgIndex, setBgIndex] = useState(0);
  const [recentLimit, setRecentLimit] = useState(10);

  const heroBg = useMemo(() => entries.filter((e) => e.poster_path).slice(0, 5), [entries]);

  useEffect(() => {
    if (heroBg.length <= 1) return;
    setBgIndex(0);
    const t = setInterval(() => setBgIndex((i) => (i + 1) % heroBg.length), 4000);
    return () => clearInterval(t);
  }, [heroBg.length]);

  const isInLibrary = (item: TMDBSearchResult) =>
    entries.some((e) => e.tmdb_id === item.tmdbId && e.media_type === item.mediaType);
  const trending = trendingInf.items.filter((item) => !isInLibrary(item));
  const movies = moviesInf.items.filter((item) => !isInLibrary(item));

  useEffect(() => {
    if (!user) return;
    getUserLibrary(user.id)
      .then(setEntries)
      .catch(console.error);
    getUserLists(user.id)
      .then((l) => setListsCount(l.length))
      .catch(console.error);
  }, [user]);

  const stats = useMemo(() => {
    const moviesCount = entries.filter((e) => e.media_type === "movie").length;
    const seriesCount = entries.filter((e) => e.media_type === "tv").length;
    const favorites = entries.filter((e) => (e.rating ?? 0) >= 4).length;
    return [
      { icon: Clapperboard, label: "Películas", value: String(moviesCount) },
      { icon: Film, label: "Series", value: String(seriesCount) },
      { icon: Sparkles, label: "Favoritas", value: String(favorites) },
      { icon: List, label: "Listas", value: String(listsCount) },
    ];
  }, [entries, listsCount]);

  const recentEntries = entries.slice(0, recentLimit);

  return (
    <div className="w-full px-5 md:px-8 pt-6 md:pt-10 pb-24 space-y-12">

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 border"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
        {/* Crossfading covers of added titles */}
        {heroBg.length > 0 && (
          <div className="absolute inset-0">
            {heroBg.map((entry, i) => (
              <img
                key={entry.id}
                src={getPosterUrl(entry.poster_path, "w500")}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2200ms] ease-in-out"
                style={{
                  opacity: i === bgIndex ? 1 : 0,
                  filter: "blur(20px) saturate(1.15)",
                  transform: "scale(1.15)",
                }}
              />
            ))}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.85) 0%, rgba(11,11,20,0.55) 50%, rgba(11,11,20,0.9) 100%)" }} />
          </div>
        )}
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-[100px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
            <Sparkles className="w-3.5 h-3.5" /> Tu rincón de cine
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
            Hola, <span className="text-gradient">{name}</span>
          </h1>
          <p className="text-base md:text-lg max-w-lg leading-relaxed mb-9" style={{ color: "var(--text-secondary)" }}>
            ¿Qué vas a ver hoy? Buscá tu próximo título o seguí donde te quedaste.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/buscar"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.04]"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 6px 22px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
              <Search className="w-[18px] h-[18px]" /> Buscar títulos
            </Link>
            <Link to="/biblioteca"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.04]"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
              <BookOpen className="w-[18px] h-[18px]" /> Mi biblioteca
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
            style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-extrabold leading-none text-gradient">{value}</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: "var(--text-secondary)" }}>{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Recently added */}
      {recentEntries.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <BookOpen className="w-5 h-5" style={{ color: "var(--accent-light)" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Recientes en tu biblioteca
            </h2>
            <Link to="/biblioteca" className="ml-auto flex items-center gap-1 text-xs font-bold hover:opacity-80"
              style={{ color: "var(--accent-light)" }}>
              Ver todo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <HorizontalCarousel
            className="gap-6 md:gap-8 pt-6 pb-6 px-1"
            onLoadMore={
              recentLimit < entries.length
                ? () => setRecentLimit((l) => Math.min(l + 8, entries.length))
                : undefined
            }
          >
            {recentEntries.map((entry) => (
              <div key={entry.id} className="w-[210px] sm:w-[240px] md:w-[270px] shrink-0 snap-start">
                <MediaCard
                  tmdbId={entry.tmdb_id}
                  title={entry.title}
                  posterPath={entry.poster_path}
                  year={null}
                  mediaType={entry.media_type}
                  status={entry.status}
                  rating={entry.rating}
                  notes={entry.notes}
                  actionLabel="Quitar"
                  onAction={() => {
                    removeFromLibrary(entry.id)
                      .then(() => {
                        if (user) getUserLibrary(user.id).then(setEntries).catch(console.error);
                      })
                      .catch(console.error);
                  }}
                  onClick={() => setSelected({
                    tmdbId: entry.tmdb_id,
                    mediaType: entry.media_type,
                    title: entry.title,
                    originalTitle: entry.title,
                    overview: "",
                    year: null,
                    releaseDate: null,
                    posterPath: entry.poster_path,
                    backdropPath: null,
                    genreIds: [],
                    tmdbRating: null,
                  })}
                />
              </div>
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* Trending carousel */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <TrendingUp className="w-5 h-5" style={{ color: "var(--accent-light)" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Tendencia de la semana
            </h2>
          </div>
          <HorizontalCarousel
            className="gap-6 pt-6 pb-6 px-1"
            onLoadMore={trendingInf.hasMore ? trendingInf.loadMore : undefined}
            loadingMore={trendingInf.loading}
          >
            {trending.map((item) => (
              <div key={`${item.mediaType}-${item.tmdbId}`} className="w-[520px] sm:w-[640px] md:w-[800px] shrink-0 snap-start">
                <HorizontalMediaCard item={item} onClick={() => setSelected(item)} />
              </div>
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* Movies carousel */}
      {movies.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Film className="w-5 h-5" style={{ color: "var(--accent-light)" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Películas populares
            </h2>
          </div>
          <HorizontalCarousel
            className="gap-4 pt-6 pb-6 px-1"
            onLoadMore={moviesInf.hasMore ? moviesInf.loadMore : undefined}
            loadingMore={moviesInf.loading}
          >
            {movies.map((item) => (
              <div key={`${item.mediaType}-${item.tmdbId}`} className="w-[300px] md:w-[340px] shrink-0 snap-start">
                <HorizontalMediaCard item={item} onClick={() => setSelected(item)} />
              </div>
            ))}
          </HorizontalCarousel>
        </section>
      )}

      {/* Quick actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/listas" className="group relative overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[70px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
            style={{ background: "var(--gradient-accent)" }} />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
              <List className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Mis listas</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Organizá títulos por tema o por mood</p>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 shrink-0" style={{ color: "var(--text-secondary)" }} />
          </div>
        </Link>
        <Link to="/buscar" className="group relative overflow-hidden rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-[70px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
            style={{ background: "var(--glow-pink)" }} />
          <div className="relative flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--surface-2)" }}>
              <Search className="w-6 h-6" style={{ color: "var(--text-secondary)" }} />
            </div>
            <div>
              <p className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>Descubrir</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Explorá películas y series nuevas</p>
            </div>
            <ChevronRight className="ml-auto w-5 h-5 shrink-0" style={{ color: "var(--text-secondary)" }} />
          </div>
        </Link>
      </section>

      {selected && (
        <MediaDetailModal
          result={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            if (user) getUserLibrary(user.id).then(setEntries).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
