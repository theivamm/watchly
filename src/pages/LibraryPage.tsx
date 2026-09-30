import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getUserLibrary } from "@/services/library";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import PageHeader from "@/components/ui/PageHeader";
import type { Entry, EntryStatus, TMDBSearchResult } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const STATUS_TABS: { value: EntryStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "want_to_watch", label: "Quiero ver" },
  { value: "watching", label: "Viendo" },
  { value: "completed", label: "Completados" },
  { value: "paused", label: "Pausados" },
  { value: "dropped", label: "Abandonados" },
];

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5";

export default function LibraryPage() {
  usePageTitle("Mi biblioteca | Watchly");
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
    <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
      <PageHeader
        title="Biblioteca"
        eyebrow="Tu historial"
        subtitle={!loading ? `${entries.length} ${entries.length === 1 ? "título" : "títulos"}` : undefined}
      />

      <div className="flex gap-2.5 mb-10 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)} data-active={activeTab === tab.value} className="frost-tab">
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={GRID}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="frost-card rounded-[1.9rem] p-2.5 animate-pulse">
              <div className="aspect-[2/3] rounded-[1.4rem] bg-white/10 mb-3" />
              <div className="h-4 rounded-lg mb-2 w-4/5 bg-white/10 mx-2" />
              <div className="h-3 rounded-lg w-2/5 bg-white/10 mx-2 mb-2" />
            </div>
          ))}
        </div>
      ) : entries.length > 0 ? (
        <div className={GRID}>
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
              notes={entry.notes}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="frost-card flex flex-col items-center justify-center py-24 rounded-[2.5rem]">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-5">
            <BookOpen className="w-7 h-7" />
          </div>
          <p className="font-cinema text-3xl mb-1">Sin títulos aún</p>
          <p className="text-sm text-white/70">Agregá películas y series desde el buscador</p>
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
