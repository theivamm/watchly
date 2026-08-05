import { useState } from "react";
import { Search } from "lucide-react";
import { useMediaSearch } from "@/hooks/useMedia";
import { useDebounce } from "@/hooks/useDebounce";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import type { TMDBSearchResult } from "@/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv">("all");
  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(null);
  const debouncedQuery = useDebounce(query);
  const { data, isLoading } = useMediaSearch(debouncedQuery, activeTab);
  const results = data?.results || [];

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Buscar
      </h1>

      {/* Search input */}
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          className="!pl-12 !py-4 !text-base !rounded-full" placeholder="¿Qué querés agregar?" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: activeTab === key ? "var(--accent-soft)" : "var(--surface-2)",
              color: activeTab === key ? "#c4b5fd" : "var(--text-secondary)",
              border: `1.5px solid ${activeTab === key ? "var(--accent)" : "var(--border)"}`,
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!query && (
        <div className="flex flex-col items-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "var(--surface-2)", boxShadow: "0 0 30px rgba(139,92,246,0.2)" }}>
            <Search className="w-7 h-7" style={{ color: "var(--text-secondary)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Escribí al menos 3 caracteres</p>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && results.length === 0 && debouncedQuery.length >= 3 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] rounded-2xl mb-3" style={{ backgroundColor: "var(--surface-2)" }} />
              <div className="h-4 rounded-lg mb-2 w-4/5" style={{ backgroundColor: "var(--surface-2)" }} />
              <div className="h-3 rounded-lg w-2/5" style={{ backgroundColor: "var(--surface-2)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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

      {/* No results */}
      {debouncedQuery.length >= 3 && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center py-24">
          <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
            No se encontraron resultados
          </p>
        </div>
      )}

      {selectedResult && (
        <MediaDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  );
}
