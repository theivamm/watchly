import { useState } from "react";
import { Search } from "lucide-react";
import { useMediaSearch } from "@/hooks/useMedia";
import { useDebounce } from "@/hooks/useDebounce";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import PageHeader from "@/components/ui/PageHeader";
import type { TMDBSearchResult } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5";

export default function SearchPage() {
  usePageTitle("Buscar | Watchly");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv">("all");
  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(null);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading } = useMediaSearch(debouncedQuery, activeTab);
  const results = data?.results || [];

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-12 text-white">
      <PageHeader title="Buscar" eyebrow="Descubrí títulos" subtitle="Películas y series de todo el mundo, con sinopsis y puntajes reales." />

      <div className="relative mb-6 max-w-2xl">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          className="glass-input with-icon !h-16 !text-base" placeholder="¿Qué querés agregar?" autoFocus />
      </div>

      <div className="flex gap-2.5 mb-10">
        {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} data-active={activeTab === key} className="frost-tab">
            {label}
          </button>
        ))}
      </div>

      {!query && (
        <div className="frost-card rounded-[2.5rem] flex flex-col items-center py-24 max-w-2xl">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-white/75">Escribí al menos 3 caracteres</p>
        </div>
      )}

      {isLoading && results.length === 0 && debouncedQuery.length >= 3 && (
        <div className={GRID}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="frost-card rounded-[1.9rem] p-2.5 animate-pulse">
              <div className="aspect-[2/3] rounded-[1.4rem] bg-white/10 mb-3" />
              <div className="h-4 rounded-lg mb-2 w-4/5 bg-white/10 mx-2" />
              <div className="h-3 rounded-lg w-2/5 bg-white/10 mx-2 mb-2" />
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className={GRID}>
          {results.map((item) => (
            <MediaCard
              key={`${item.mediaType}-${item.tmdbId}`}
              tmdbId={item.tmdbId}
              title={item.title}
              posterPath={item.posterPath}
              year={item.year}
              mediaType={item.mediaType}
              tmdbRating={item.tmdbRating}
              onClick={() => setSelectedResult(item)}
            />
          ))}
        </div>
      )}

      {debouncedQuery.length >= 3 && !isLoading && results.length === 0 && (
        <div className="frost-card rounded-[2.5rem] flex flex-col items-center py-20 max-w-2xl">
          <p className="text-sm font-bold text-white/75">No se encontraron resultados</p>
        </div>
      )}

      {selectedResult && <MediaDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
    </div>
  );
}
