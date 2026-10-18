import "@/styles/cinema.css";
import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useMediaSearch } from "@/hooks/useMedia";
import { useDebounce } from "@/hooks/useDebounce";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import PageHeader from "@/components/ui/PageHeader";
import type { TMDBSearchResult } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 gap-4";

export default function SearchPage() {
  usePageTitle("Buscar | Watchly");
  const [params] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv">("all");
  const [selectedResult, setSelectedResult] = useState<TMDBSearchResult | null>(null);
  const debouncedQuery = useDebounce(query, 150);
  const { data, isLoading } = useMediaSearch(debouncedQuery, activeTab);
  const results = data?.results || [];
  const posters = useMemo(() => results.filter((r) => r.posterPath).slice(0, 14).map((r) => r.posterPath as string), [results]);

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
      <PageHeader
        title={debouncedQuery.length >= 2 ? `Resultados para “${debouncedQuery}”` : "Buscar"}
        eyebrow="Encontrá tu próxima historia"
        subtitle={results.length > 0 ? `${results.length} coincidencias. Abrí una ficha y sumala a tu biblioteca.` : "Películas y series de todo el mundo, con sinopsis y puntajes reales."}
        posters={posters}
      />

      <div className="liquid-glass rounded-full p-2 flex flex-wrap items-center gap-2 mb-8">
        <p className="flex-1 min-w-[160px] pl-5 text-sm text-white/70 truncate">{query ? `Buscando “${query}”` : "Usá la barra de arriba para buscar"}</p>
        <div className="flex gap-1">
          {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setActiveTab(k)} className="h-12 px-5 rounded-full text-sm font-extrabold transition-colors"
              style={{ background: activeTab === k ? "#fff" : "transparent", color: activeTab === k ? "#111" : "rgba(255,255,255,.85)" }}>{l}</button>
          ))}
        </div>
      </div>

      {query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-24 border-t border-white/20 text-center">
          <div className="liquid-glass-sm w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Search className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-white/75">Escribí en la barra de arriba para buscar</p>
        </div>
      )}

      {isLoading && results.length === 0 && debouncedQuery.length >= 2 && (
        <div className={GRID}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-[1.75rem] bg-white/10 animate-pulse">
              
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

      {debouncedQuery.length >= 2 && !isLoading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 border-t border-white/20 text-center">
          <p className="text-sm font-bold text-white/75">No se encontraron resultados</p>
        </div>
      )}

      {selectedResult && <MediaDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />}
    </div>
  );
}
