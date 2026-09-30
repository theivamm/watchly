import "@/styles/cinema.css";
import { useState, useEffect, useCallback, useMemo } from "react";
import { BookOpen, Search, LayoutGrid, List as ListIcon, Star, Bookmark, Play, CheckCheck, Pause, XCircle } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLibrary } from "@/services/library";
import { getPosterUrl } from "@/services/tmdb";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import PageHeader from "@/components/ui/PageHeader";
import type { Entry, EntryStatus, TMDBSearchResult } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_META: Record<EntryStatus, { label: string; color: string; icon: typeof Bookmark }> = {
  want_to_watch: { label: "Quiero ver", color: "hsl(265 90% 78%)", icon: Bookmark },
  watching: { label: "Viendo", color: "hsl(145 70% 65%)", icon: Play },
  completed: { label: "Completados", color: "hsl(210 90% 72%)", icon: CheckCheck },
  paused: { label: "Pausados", color: "hsl(48 95% 68%)", icon: Pause },
  dropped: { label: "Abandonados", color: "hsl(0 90% 74%)", icon: XCircle },
};
const STATUS_ORDER: EntryStatus[] = ["want_to_watch", "watching", "completed", "paused", "dropped"];

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5";

export default function LibraryPage() {
  usePageTitle("Mi biblioteca | Watchly");
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<EntryStatus | "all">("all");
  const [type, setType] = useState<"all" | "movie" | "tv">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "rating" | "title">("recent");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<Entry | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getUserLibrary(user.id)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    STATUS_ORDER.forEach((s) => (c[s] = entries.filter((e) => e.status === s).length));
    return c;
  }, [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter(
      (e) => (status === "all" || e.status === status) && (type === "all" || e.media_type === type) && (!q || e.title.toLowerCase().includes(q)),
    );
    if (sort === "rating") return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [entries, status, type, query, sort]);

  const toResult = (entry: Entry): TMDBSearchResult => ({
    tmdbId: entry.tmdb_id, mediaType: entry.media_type, title: entry.title, originalTitle: entry.title,
    overview: "", year: null, releaseDate: null, posterPath: entry.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
  });

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
      <PageHeader
        title="Biblioteca"
        eyebrow="Tu historial"
        subtitle={!loading ? `${entries.length} ${entries.length === 1 ? "título" : "títulos"} guardados` : undefined}
        actions={
          <div className="liquid-glass-sm rounded-full p-1 flex">
            {([["grid", LayoutGrid], ["list", ListIcon]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)} aria-label={v === "grid" ? "Cuadrícula" : "Lista"}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                style={{ background: view === v ? "#fff" : "transparent", color: view === v ? "#111" : "#fff" }}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        }
      />

      {/* Resumen por estado */}
      {!loading && entries.length > 0 && (
        <div className="liquid-glass rounded-[2rem] p-5 md:p-6 mb-8">
          <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
            {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
              <div key={s} style={{ width: `${(counts[s] / entries.length) * 100}%`, background: STATUS_META[s].color }} />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {STATUS_ORDER.map((s) => {
              const m = STATUS_META[s];
              const Icon = m.icon;
              const active = status === s;
              return (
                <button key={s} onClick={() => setStatus(active ? "all" : s)}
                  className="text-left rounded-[1.25rem] px-4 py-3 transition-all border"
                  style={{ background: active ? "rgba(255,255,255,.16)" : "transparent", borderColor: active ? "rgba(255,255,255,.4)" : "transparent" }}>
                  <p className="font-cinema text-4xl leading-none" style={{ color: m.color }}>{counts[s]}</p>
                  <p className="text-[11px] font-extrabold mt-2 inline-flex items-center gap-1.5 text-white/80"><Icon className="w-3.5 h-3.5" /> {m.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en tu biblioteca…" className="glass-input with-icon !h-12 !text-sm" />
        </div>
        <div className="flex gap-2">
          {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} data-active={type === k} className="frost-tab !py-2.5 !px-4 !text-xs">{l}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="glass-input !h-12 !w-auto !text-sm !pr-10 ml-auto">
          <option value="recent">Más recientes</option>
          <option value="rating">Mejor calificadas</option>
          <option value="title">A – Z</option>
        </select>
      </div>

      {loading ? (
        <div className={GRID}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="frost-card rounded-[1.9rem] p-2.5 animate-pulse">
              <div className="aspect-[2/3] rounded-[1.4rem] bg-white/10 mb-3" />
              <div className="h-4 rounded-lg mb-2 w-4/5 bg-white/10 mx-2" />
              <div className="h-3 rounded-lg w-2/5 bg-white/10 mx-2 mb-2" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="frost-card flex flex-col items-center justify-center py-24 rounded-[2.5rem]">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-5"><BookOpen className="w-7 h-7" /></div>
          <p className="font-cinema text-3xl mb-1">{entries.length === 0 ? "Sin títulos aún" : "Sin resultados"}</p>
          <p className="text-sm text-white/70">{entries.length === 0 ? "Agregá películas y series desde el buscador" : "Probá con otro filtro o búsqueda"}</p>
        </div>
      ) : view === "grid" ? (
        <div className={GRID}>
          {shown.map((entry) => (
            <MediaCard key={entry.id} tmdbId={entry.tmdb_id} title={entry.title} posterPath={entry.poster_path} year={null}
              mediaType={entry.media_type} status={entry.status} rating={entry.rating} notes={entry.notes} onClick={() => setSelected(entry)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((entry) => {
            const m = STATUS_META[entry.status];
            const Icon = m.icon;
            return (
              <button key={entry.id} onClick={() => setSelected(entry)}
                className="frost-card flex items-center gap-5 p-3 pr-6 rounded-[1.75rem] text-left transition-transform hover:-translate-y-0.5">
                <img src={getPosterUrl(entry.poster_path, "w200")} alt={entry.title} loading="lazy" className="w-16 md:w-20 aspect-[2/3] object-cover rounded-2xl shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-base md:text-lg truncate">{entry.title}</p>
                  <p className="text-xs mt-1 text-white/65">{entry.media_type === "movie" ? "Película" : "Serie"}</p>
                  {entry.notes && <p className="text-sm mt-2 line-clamp-1 text-white/80">{entry.notes}</p>}
                </div>
                {entry.rating != null && entry.rating > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-sm font-extrabold"><Star className="w-4 h-4" fill="currentColor" style={{ color: "var(--accent)" }} /> {entry.rating}</span>
                )}
                <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold shrink-0" style={{ color: m.color }}>
                  <Icon className="w-3.5 h-3.5" /> <span className="hidden md:inline text-white">{m.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <MediaDetailModal
          result={toResult(selected)}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
