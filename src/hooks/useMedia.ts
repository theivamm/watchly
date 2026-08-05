import { useQuery } from "@tanstack/react-query";
import { searchMedia, getMediaDetails, getTrending } from "@/services/tmdb";

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

export function useMediaDetails(type: "movie" | "tv" | null, tmdbId: number | null) {
  return useQuery({
    queryKey: ["media-details", type, tmdbId],
    queryFn: () => getMediaDetails(type!, tmdbId!),
    enabled: !!type && !!tmdbId,
  });
}
