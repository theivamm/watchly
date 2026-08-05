import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLibrary } from "@/services/library";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import type { Entry, EntryStatus, TMDBSearchResult } from "@/types";

const STATUS_TABS: { value: EntryStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "want_to_watch", label: "Quiero ver" },
  { value: "watching", label: "Viendo" },
  { value: "completed", label: "Completados" },
  { value: "paused", label: "Pausados" },
  { value: "dropped", label: "Abandonados" },
];

export default function LibraryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EntryStatus | "all">("all");
  const [selected, setSelected] = useState<Entry | null>(null);

  const load = useCallback(() => {
    if (!user) return;
    setLoading(true);
    getUserLibrary(user.id, activeTab === "all" ? undefined : { status: activeTab })
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const toResult = (entry: Entry): TMDBSearchResult => ({
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
  });

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Biblioteca
      </h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === tab.value ? "var(--accent-soft)" : "var(--surface-2)",
              color: activeTab === tab.value ? "#c4b5fd" : "var(--text-secondary)",
              border: `1.5px solid ${activeTab === tab.value ? "var(--accent)" : "var(--border)"}`,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-2xl mb-3" style={{ backgroundColor: "var(--surface-2)" }} />
              <div className="h-4 rounded-lg mb-2 w-4/5" style={{ backgroundColor: "var(--surface-2)" }} />
              <div className="h-3 rounded-lg w-2/5" style={{ backgroundColor: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {entries.map((entry) => (
            <MediaCard
              key={entry.id}
              tmdbId={entry.tmdb_id}
              title={entry.title}
              posterPath={entry.poster_path}
              year={null}
              mediaType={entry.media_type}
              status={entry.status}
              rating={entry.rating}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: "var(--surface-2)" }}>
            <BookOpen className="w-7 h-7" style={{ color: "var(--text-secondary)" }} />
          </div>
          <p className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>Sin títulos aún</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Agregá películas y series desde el buscador</p>
        </div>
      )}
      {selected && (
        <MediaDetailModal
          result={toResult(selected)}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
