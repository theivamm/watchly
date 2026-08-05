import type { MediaType, TMDBSearchResult, TMDBMediaDetails } from "@/types";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN || "";

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({
    ...params,
    language: "es-AR",
    include_adult: "false",
  });
  const res = await fetch(`${TMDB_BASE}${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: "application/json",
    },
  });
  if (!res.ok) throw new Error("Error fetching data from TMDB");
  return (await res.json()) as Record<string, unknown>;
}

function mapResult(r: Record<string, unknown>, mediaType: string): TMDBSearchResult {
  return {
    tmdbId: r.id as number,
    mediaType: ((r.media_type as MediaType) || mediaType) as MediaType,
    title: ((r.title as string) || (r.name as string)) || "",
    originalTitle: ((r.original_title as string) || (r.original_name as string)) || "",
    overview: (r.overview as string) || "",
    year: Number((((r.release_date as string) || (r.first_air_date as string)) || "").substring(0, 4)) || null,
    releaseDate: (r.release_date as string) || (r.first_air_date as string) || null,
    posterPath: (r.poster_path as string) || null,
    backdropPath: (r.backdrop_path as string) || null,
    genreIds: (r.genre_ids as number[]) || [],
    tmdbRating: (r.vote_average as number) || null,
  };
}

export async function searchMedia(
  query: string,
  type: "all" | "movie" | "tv" = "all",
  page: number = 1
): Promise<{ results: TMDBSearchResult[]; totalResults: number }> {
  let endpoint = "/search/multi";
  if (type === "movie") endpoint = "/search/movie";
  if (type === "tv") endpoint = "/search/tv";

  const data = await tmdbFetch(endpoint, { query, page: String(page) });
  const results = ((data.results as Record<string, unknown>[]) || [])
    .filter((r) => {
      if (type === "all") return r.media_type === "movie" || r.media_type === "tv";
      return true;
    })
    .slice(0, 20)
    .map((r) => mapResult(r, type === "all" ? "movie" : type));

  return { results, totalResults: (data.total_results as number) || 0 };
}

export async function getTrending(
  type: "all" | "movie" | "tv" = "all",
  page: number = 1
): Promise<{ results: TMDBSearchResult[]; totalResults: number }> {
  const media = type;
  const data = await tmdbFetch(`/trending/${media}/week`, { page: String(page) });

  const results = ((data.results as Record<string, unknown>[]) || [])
    .filter((r) => {
      const mt = r.media_type as string;
      if (type === "all") return mt === "movie" || mt === "tv";
      return true;
    })
    .slice(0, 20)
    .map((r) => mapResult(r, (r.media_type as string) || "movie"));

  return { results, totalResults: (data.total_results as number) || 0 };
}

export async function getMediaDetails(
  type: "movie" | "tv",
  tmdbId: number
): Promise<TMDBMediaDetails> {
  const data = await tmdbFetch(`/${type}/${tmdbId}`, {
    append_to_response: "videos,credits",
  });

  return {
    ...mapResult(data, type),
    genres: ((data.genres as { name: string }[]) || []).map((g) => g.name),
    runtime: (data.runtime as number) || null,
    voteCount: (data.vote_count as number) || 0,
    videos: ((data.videos as { results: Record<string, unknown>[] })?.results || []).slice(0, 5),
    cast: ((data.credits as { cast: { name: string }[] })?.cast || []).slice(0, 10),
  };
}

export function getPosterUrl(posterPath: string | null, size: "w200" | "w342" | "w500" = "w342"): string {
  if (!posterPath) return "/placeholder-poster.png";
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export function getBackdropUrl(backdropPath: string | null, size: "w780" | "w1280" = "w1280"): string {
  if (!backdropPath) return "/placeholder-backdrop.png";
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}
