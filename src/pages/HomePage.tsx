import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { Link } from "react-router-dom";
import { Search, BookOpen, List, Sparkles, TrendingUp, ChevronRight, Film, Clapperboard } from "lucide-react";
import { useTrending } from "@/hooks/useMedia";
import HorizontalMediaCard from "@/components/media/HorizontalMediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import { getUserLibrary, removeFromLibrary } from "@/services/library";
import { getUserLists } from "@/services/lists";
import type { TMDBSearchResult, Entry } from "@/types";

export default function HomePage() {
  const { user, profile } = useAuth();
  const name = profile?.display_name || user?.email?.split("@")[0] || "usuario";
  const { data: trendingAll } = useTrending("all");
  const { data: trendingMovies } = useTrending("movie");
  const trending = trendingAll?.results || [];
  const movies = trendingMovies?.results || [];

  const [entries, setEntries] = useState<Entry[]>([]);
  const [listsCount, setListsCount] = useState(0);
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);

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

  const recentEntries = entries.slice(0, 10);

  return (
    <div className="w-full px-5 md:px-8 pt-6 md:pt-10 pb-24 space-y-12">

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 border"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.25)" }}>
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-[100px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ backgroundColor: "var(--accent-soft)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
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
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 6px 22px rgba(139,92,246,0.45)" }}>
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
              style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}>
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
            <BookOpen className="w-5 h-5" style={{ color: "#c4b5fd" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Recientes en tu biblioteca
            </h2>
            <Link to="/biblioteca" className="ml-auto flex items-center gap-1 text-xs font-bold hover:opacity-80"
              style={{ color: "#c4b5fd" }}>
              Ver todo <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {recentEntries.map((entry) => (
              <div key={entry.id} className="w-[300px] md:w-[340px] h-36 md:h-44 shrink-0 snap-start">
                <HorizontalMediaCard
                  item={{
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
                  }}
                  added
                  onRemove={() => {
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
          </div>
        </section>
      )}

      {/* Trending carousel */}
      {trending.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <TrendingUp className="w-5 h-5" style={{ color: "#c4b5fd" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Tendencia de la semana
            </h2>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 snap-x">
            {trending.slice(0, 14).map((item) => (
              <div key={`${item.mediaType}-${item.tmdbId}`} className="w-[520px] sm:w-[640px] md:w-[800px] h-72 sm:h-80 md:h-[28rem] shrink-0 snap-start">
                <HorizontalMediaCard item={item} onClick={() => setSelected(item)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Movies carousel */}
      {movies.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Film className="w-5 h-5" style={{ color: "#c4b5fd" }} />
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Películas populares
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
            {movies.slice(0, 14).map((item) => (
              <div key={`${item.mediaType}-${item.tmdbId}`} className="w-[300px] md:w-[340px] h-36 md:h-44 shrink-0 snap-start">
                <HorizontalMediaCard item={item} onClick={() => setSelected(item)} />
              </div>
            ))}
          </div>
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
              style={{ background: "var(--gradient-accent)", boxShadow: "0 6px 20px rgba(139,92,246,0.4)" }}>
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
