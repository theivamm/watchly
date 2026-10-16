import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTrending } from "@/hooks/useMedia";
import { searchMedia } from "@/services/tmdb";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import type { TMDBSearchResult } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const GRID = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6";
export default function SearchPage() {
  usePageTitle("Explorar | Watchly");
  const [params, setParams] = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const rawType = params.get("tipo");
  const type = rawType === "movie" || rawType === "tv" ? rawType : "all";
  const [sort, setSort] = useState("relevance");
  const [year, setYear] = useState("");
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const searching = query.length >= 2;
  const search = useInfiniteQuery({
    queryKey: ["search-pages", query, type], initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => searchMedia(query, type, pageParam, signal),
    getNextPageParam: (last, pages) => pages.length < Math.min(last.totalPages, 500) ? pages.length + 1 : undefined,
    enabled: searching, staleTime: 5 * 60_000,
  });
  const trending = useTrending(type);
  const source = searching ? search.data?.pages.flatMap((page) => page.results) ?? [] : trending.data?.results ?? [];
  const unique = [...new Map(source.map((item) => [`${item.mediaType}-${item.tmdbId}`, item])).values()];
  const results = unique.filter((item) => !year || String(item.year) === year).sort((a, b) => sort === "rating" ? (b.tmdbRating ?? 0) - (a.tmdbRating ?? 0) : sort === "newest" ? (b.year ?? 0) - (a.year ?? 0) : 0);
  const loading = searching ? search.isLoading : trending.isLoading;
  const error = searching ? search.isError : trending.isError;
  const setType = (value: string) => { const next = new URLSearchParams(params); next.set("tipo", value); setParams(next); setYear(""); };
  return <div className="px-5 md:px-10 py-9 text-white">
    <p className="text-xs uppercase tracking-[.2em] font-bold text-violet-200">Encontrá tu próxima historia</p>
    <h1 className="font-cinema text-5xl md:text-7xl mt-3">{searching ? `Resultados para “${query}”` : "Hay mucho por descubrir"}</h1>
    <p className="text-white/65 mt-4 max-w-2xl">{searching ? "Explorá coincidencias, abrí una ficha y sumá tu próxima película o serie." : "Lo que está en tendencia esta semana. Buscá un título desde la barra superior o empezá por acá."}</p>
    {query.length === 1 && <p className="mt-4 text-amber-200" role="status">Escribí al menos 2 caracteres en la barra para buscar.</p>}
    <div className="flex flex-wrap gap-3 items-center mt-8 mb-6">
      {([["all", "Todo"], ["movie", "Películas"], ["tv", "Series"]] as const).map(([value, label]) => <button key={value} aria-pressed={type === value} data-active={type === value} onClick={() => setType(value)} className="frost-tab">{label}</button>)}
      <label className="text-xs text-white/70 sm:ml-auto">Ordenar<select className="block bg-[#24212f] border border-white/20 text-white rounded-xl p-2 mt-1" value={sort} onChange={(e) => setSort(e.target.value)}><option value="relevance">{searching ? "Relevancia" : "Tendencia"}</option><option value="newest">Más recientes</option><option value="rating">Puntaje TMDB</option></select></label>
      <label className="text-xs text-white/70">Año<input type="number" min="1870" max="2100" placeholder="Todos" value={year} onChange={(e) => setYear(e.target.value)} className="block w-24 bg-[#24212f] border border-white/20 text-white rounded-xl p-2 mt-1" /></label>
    </div>
    <div className="flex flex-wrap justify-between gap-2 mb-6 text-sm text-white/60" role="status"><p>{searching ? `${results.length} títulos visibles · ${search.data?.pages[0]?.totalResults ?? "…"} coincidencias en el catálogo` : "En tendencia esta semana"}</p>{(year || sort !== "relevance") && <p>El año y el orden se aplican a los títulos cargados.</p>}</div>
    {loading && <div className={GRID} aria-label="Cargando títulos">{Array.from({ length: 10 }, (_, i) => <div key={i} className="aspect-[2/3] rounded-3xl bg-white/10 animate-pulse" />)}</div>}
    {error && <div role="alert" className="rounded-2xl border border-red-300/30 p-6 mb-6"><p>No pudimos cargar {searching ? "los resultados" : "las tendencias"}. Tus filtros se mantienen.</p><button className="mt-3 underline" onClick={() => searching ? search.refetch() : trending.refetch()}>Reintentar</button></div>}
    {!loading && results.length > 0 && <div className={GRID}>{results.map((item) => <MediaCard key={`${item.mediaType}-${item.tmdbId}`} tmdbId={item.tmdbId} title={item.title} posterPath={item.posterPath} year={item.year} mediaType={item.mediaType} tmdbRating={item.tmdbRating} onClick={() => setSelected(item)} />)}</div>}
    {!loading && !error && !results.length && <div className="liquid-glass rounded-3xl p-8"><h2 className="font-cinema text-3xl">Todavía no encontramos esa historia</h2><p className="text-white/70 mt-3">{year ? "No hay coincidencias de ese año entre los títulos cargados. Quitá el filtro o cargá más resultados." : "Probá el título original, menos palabras o cambiá entre películas y series."}</p>{year && <button className="mt-4 underline" onClick={() => setYear("")}>Quitar año</button>}</div>}
    {searching && search.hasNextPage && <button disabled={search.isFetchingNextPage} onClick={() => search.fetchNextPage()} className="block mx-auto mt-9 rounded-full bg-white text-[#111] px-8 py-4 font-bold disabled:opacity-50">{search.isFetchingNextPage ? "Cargando…" : "Cargar más resultados"}</button>}
    <Link to="/que-vemos-hoy" className="liquid-glass flex flex-wrap justify-between items-center gap-4 p-6 md:p-8 rounded-3xl mt-12"><span><span className="font-cinema text-3xl">¿Preferís elegir entre tus pendientes?</span><span className="block mt-2 text-white/65 text-sm">Armamos un plan según tu tiempo y tus ganas.</span></span><span className="font-bold text-violet-200">¿Qué vemos hoy? →</span></Link>
    {selected && <MediaDetailModal result={selected} onClose={() => setSelected(null)} />}
  </div>;
}
