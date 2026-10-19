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

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4";

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
    getUserLibrary(user.id).then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: entries.length };
    STATUS_ORDER.forEach((s) => (c[s] = entries.filter((e) => e.status === s).length));
    return c;
  }, [entries]);

  const posters = useMemo(() => entries.filter((e) => e.poster_path).slice(0, 14).map((e) => e.poster_path as string), [entries]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = entries.filter((e) => (status === "all" || e.status === status) && (type === "all" || e.media_type === type) && (!q || e.title.toLowerCase().includes(q)));
    if (sort === "rating") return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [entries, status, type, query, sort]);

  const toResult = (entry: Entry): TMDBSearchResult => ({
    tmdbId: entry.tmdb_id, mediaType: entry.media_type, title: entry.title, originalTitle: entry.title,
    overview: "", year: null, releaseDate: null, posterPath: entry.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
  });

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
      <PageHeader
        title="Biblioteca"
        eyebrow="Tu historial"
        subtitle={!loading ? `${entries.length} ${entries.length === 1 ? "título guardado" : "títulos guardados"}. Tocá un estado para filtrar.` : undefined}
        posters={posters}
        stats={!loading && entries.length > 0 ? STATUS_ORDER.map((s) => ({ v: counts[s], l: STATUS_META[s].label, color: STATUS_META[s].color, active: status === s, onClick: () => setStatus(status === s ? "all" : s) })) : undefined}
      />

      <div className="liquid-glass rounded-full p-2 flex flex-wrap items-center gap-2 mb-8">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en tu biblioteca…" className="w-full h-12 pl-12 pr-4 bg-transparent outline-none text-sm placeholder:text-white/50" style={{ outline: "none", boxShadow: "none" }} />
        </div>
        <div className="flex gap-1">
          {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setType(k)} className="h-12 px-5 rounded-full text-sm font-extrabold transition-colors" style={{ background: type === k ? "#fff" : "transparent", color: type === k ? "#111" : "rgba(255,255,255,.85)" }}>{l}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="glass-input !h-12 !w-auto !text-sm !pr-10 !rounded-full">
          <option value="recent">Más recientes</option>
          <option value="rating">Mejor calificadas</option>
          <option value="title">A – Z</option>
        </select>
        <div className="flex gap-1 pr-1">
          {([["grid", LayoutGrid], ["list", ListIcon]] as const).map(([v, Icon]) => (
            <button key={v} onClick={() => setView(v)} aria-label={v === "grid" ? "Cuadrícula" : "Lista"} className="w-12 h-12 rounded-full flex items-center justify-center transition-colors" style={{ background: view === v ? "#fff" : "transparent", color: view === v ? "#111" : "#fff" }}>
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={GRID}>
          {Array.from({ length: 14 }).map((_, i) => <div key={i} className="aspect-[2/3] rounded-[1.75rem] bg-white/10 animate-pulse" />)}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-t border-white/20 text-center">
          <BookOpen className="w-10 h-10 mb-5 text-white/60" />
          <p className="font-cinema text-5xl mb-2">{entries.length === 0 ? "Sin títulos aún" : "Sin resultados"}</p>
          <p className="text-base text-white/70">{entries.length === 0 ? "Agregá películas y series desde el buscador" : "Probá con otro filtro o búsqueda"}</p>
        </div>
      ) : view === "grid" ? (
        <div className={GRID}>
          {shown.map((entry) => (
            <MediaCard key={entry.id} tmdbId={entry.tmdb_id} title={entry.title} posterPath={entry.poster_path} year={null}
              mediaType={entry.media_type} status={entry.status} rating={entry.rating} notes={entry.notes} onClick={() => setSelected(entry)} />
          ))}
        </div>
      ) : (
        <div>
          {shown.map((entry) => {
            const m = STATUS_META[entry.status];
            const Icon = m.icon;
            return (
              <button key={entry.id} onClick={() => setSelected(entry)} className="group w-full flex items-center gap-6 py-4 border-t border-white/15 text-left hover:bg-white/5 transition-colors px-2">
                <img src={getPosterUrl(entry.poster_path, "w200")} alt={entry.title} loading="lazy" className="w-16 md:w-20 aspect-[2/3] object-cover rounded-2xl shrink-0 border border-white/20" />
                <div className="min-w-0 flex-1">
                  <p className="font-cinema text-3xl md:text-4xl leading-none truncate">{entry.title}</p>
                  <p className="text-xs font-extrabold uppercase tracking-widest mt-2 text-white/65">{entry.media_type === "movie" ? "Película" : "Serie"}</p>
                  {entry.notes && <p className="text-sm mt-2 line-clamp-1 text-white/80">{entry.notes}</p>}
                </div>
                {entry.rating != null && entry.rating > 0 && <span className="hidden sm:inline-flex items-center gap-1.5 text-lg font-extrabold"><Star className="w-5 h-5" fill="currentColor" /> {entry.rating}</span>}
                <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-extrabold shrink-0" style={{ color: m.color }}>
                  <Icon className="w-4 h-4" /> <span className="hidden md:inline text-white">{m.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selected && <MediaDetailModal result={toResult(selected)} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load(); }} />}
    </div>
  );
}
