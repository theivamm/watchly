import { useMemo } from "react";
import { useTrending } from "@/hooks/useMedia";
import type { TMDBSearchResult } from "@/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Portadas al azar (distintas en cada visita) mezclando tendencias de películas, series y todo. */
export function useRandomCovers(count = 8, needOverview = false): TMDBSearchResult[] {
  const all = useTrending("all").data?.results;
  const movies = useTrending("movie").data?.results;
  const tv = useTrending("tv").data?.results;
  const total = (all?.length ?? 0) + (movies?.length ?? 0) + (tv?.length ?? 0);
  return useMemo(() => {
    const seen = new Set<string>();
    const pool = [...(all ?? []), ...(movies ?? []), ...(tv ?? [])].filter((i) => {
      const k = `${i.mediaType}-${i.tmdbId}`;
      if (seen.has(k) || !i.posterPath || !i.backdropPath || (needOverview && !i.overview)) return false;
      seen.add(k);
      return true;
    });
    return shuffle(pool).slice(0, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, count, needOverview]);
}
