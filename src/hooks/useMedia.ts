import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMedia, getMediaDetails, getTrending } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

export function useMediaSearch(query: string, type: "all" | "movie" | "tv" = "all") {
  return useQuery({
    queryKey: ["media-search", query, type],
    queryFn: () => searchMedia(query, type),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
}

export function useTrending(type: "all" | "movie" | "tv" = "all") {
  return useQuery({
    queryKey: ["trending", type],
    queryFn: () => getTrending(type),
    staleTime: 1000 * 60 * 60,
  });
}

export function useInfiniteTrending(type: "all" | "movie" | "tv" = "all") {
  const [items, setItems] = useState<TMDBSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const totalPagesRef = useRef(Infinity);
  const loadingRef = useRef(false);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    totalPagesRef.current = Infinity;
    let cancelled = false;
    getTrending(type, 1)
      .then((data) => {
        if (cancelled) return;
        setItems(data.results);
        setPage(2);
        totalPagesRef.current = data.totalPages || 1;
        setHasMore(data.results.length > 0 && 1 < (data.totalPages || 1));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [type]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await getTrending(type, page);
      setItems((prev) => {
        const seen = new Set(prev.map((i) => `${i.mediaType}-${i.tmdbId}`));
        return [...prev, ...data.results.filter((i) => !seen.has(`${i.mediaType}-${i.tmdbId}`))];
      });
      totalPagesRef.current = data.totalPages || 1;
      setPage((p) => p + 1);
      setHasMore(data.results.length > 0 && page < totalPagesRef.current);
    } catch (err) {
      console.error(err);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [type, page]);

  return { items, hasMore, loading, loadMore };
}

export function useMediaDetails(type: "movie" | "tv" | null, tmdbId: number | null) {
  return useQuery({
    queryKey: ["media-details", type, tmdbId],
    queryFn: () => getMediaDetails(type!, tmdbId!),
    enabled: !!type && !!tmdbId,
  });
}
