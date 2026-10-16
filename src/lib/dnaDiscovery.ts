import type { Entry, TMDBSearchResult, WeightedMetric } from "@/types";

const movieGenre: Record<string, string> = { "10759": "28", "10765": "878", "10768": "10752" };
export function rankNewDnaMovies(items: TMDBSearchResult[], library: Pick<Entry, "tmdb_id" | "media_type">[], genres: WeightedMetric[]) {
  const existing = new Set(library.map((entry) => `${entry.media_type}:${entry.tmdb_id}`));
  const unique = new Map(items.map((item) => [`${item.mediaType}:${item.tmdbId}`, item]));
  return [...unique.values()].flatMap((item) => {
    if (item.mediaType !== "movie" || existing.has(`movie:${item.tmdbId}`)) return [];
    const matching = genres.filter((genre) => item.genreIds.includes(Number(movieGenre[genre.key] ?? genre.key)));
    if (!matching.length) return [];
    return [{ item, score: matching.reduce((sum, genre) => sum + Math.max(genre.weight, 0), 0), reason: `Por tu afinidad con ${matching.slice(0, 2).map((genre) => genre.label.toLowerCase()).join(" y ")}` }];
  }).sort((a, b) => b.score - a.score || (b.item.tmdbRating ?? 0) - (a.item.tmdbRating ?? 0));
}
