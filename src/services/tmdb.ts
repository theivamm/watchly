import type { MediaType, TMDBSearchResult, TMDBMediaDetails } from "@/types";
import { track } from "@/lib/telemetry";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN || "";

async function tmdbFetch(path: string, params: Record<string, string> = {}, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const query = new URLSearchParams({
    ...params,
    language: "es-AR",
    include_adult: "false",
  });
  const res = await fetch(`${TMDB_BASE}${path}?${query}`, {
    signal,
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
  page: number = 1,
  signal?: AbortSignal,
): Promise<{ results: TMDBSearchResult[]; totalResults: number; totalPages: number }> {
  let endpoint = "/search/multi";
  if (type === "movie") endpoint = "/search/movie";
  if (type === "tv") endpoint = "/search/tv";

  const t0 = performance.now();
  let data: Record<string, unknown>;
  try {
    data = await tmdbFetch(endpoint, { query, page: String(page) }, signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    track("search_failed", { type });
    throw err;
  }
  if (page === 1) track("search", { type, ms: Math.round(performance.now() - t0), results: (data.total_results as number) || 0 });
  const results = ((data.results as Record<string, unknown>[]) || [])
    .filter((r) => {
      if (type === "all") return r.media_type === "movie" || r.media_type === "tv";
      return true;
    })
    .slice(0, 20)
    .map((r) => mapResult(r, type === "all" ? "movie" : type));

  return { results, totalResults: (data.total_results as number) || 0, totalPages: (data.total_pages as number) || 0 };
}

export async function getTrending(
  type: "all" | "movie" | "tv" = "all",
  page: number = 1
): Promise<{ results: TMDBSearchResult[]; totalResults: number; totalPages: number }> {
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

  return { results, totalResults: (data.total_results as number) || 0, totalPages: (data.total_pages as number) || 0 };
}

// TMDB usa IDs de género distintos para películas y series.
const MOVIE_TO_TV: Record<string, string> = { "28": "10759", "12": "10759", "878": "10765", "14": "10765", "10752": "10768" };
const TV_TO_MOVIE: Record<string, string> = { "10759": "28", "10765": "878", "10768": "10752" };
const TV_ONLY = new Set(["10762", "10763", "10764", "10766", "10767"]);
const MOVIE_ONLY = new Set(["36", "10770", "10402", "27", "53", "10749"]);

async function discover(
  type: "movie" | "tv",
  genreIds: string[] | null,
  extra: Record<string, string> = {},
): Promise<TMDBSearchResult[]> {
  if (genreIds && genreIds.length === 0) return [];
  const data = await tmdbFetch(`/discover/${type}`, {
    ...(genreIds ? { with_genres: genreIds.join("|") } : {}),
    sort_by: "popularity.desc",
    "vote_count.gte": "200",
    "vote_average.gte": "6.5",
    ...extra,
  });
  return ((data.results as Record<string, unknown>[]) || []).map((r) => mapResult(r, type));
}

export async function getKoreanRecommendations(): Promise<{ dramas: TMDBSearchResult[]; movies: TMDBSearchResult[] }> {
  const korea = { with_origin_country: "KR", "vote_count.gte": "80" };
  const [dramas, movies] = await Promise.all([
    discover("tv", ["18"], korea).catch(() => []),
    discover("movie", null, korea).catch(() => []),
  ]);
  return { dramas, movies };
}

export async function getDnaMovieDiscoveries(genreKeys: string[]): Promise<TMDBSearchResult[]> {
  const genres = [...new Set(genreKeys.slice(0, 3).map((key) => TV_TO_MOVIE[key] ?? key).filter((key) => !TV_ONLY.has(key)))];
  if (!genres.length) return [];
  const pages = await Promise.all([1, 2, 3].map((page) => discover("movie", genres, { page: String(page) })));
  return pages.flat();
}

export async function getDnaRecommendations(
  genreKeys: string[],
  format: { movie: number; tv: number },
): Promise<TMDBSearchResult[]> {
  const keys = genreKeys.slice(0, 3);
  const movieGenres = [...new Set(keys.map((k) => TV_TO_MOVIE[k] ?? k).filter((k) => !TV_ONLY.has(k)))];
  const tvGenres = [...new Set(keys.map((k) => MOVIE_TO_TV[k] ?? k).filter((k) => !MOVIE_ONLY.has(k)))];

  const [movies, shows] = await Promise.all([
    discover("movie", movieGenres).catch(() => []),
    discover("tv", tvGenres).catch(() => []),
  ]);

  // Intercala según la proporción película/serie del ADN.
  const total = format.movie + format.tv;
  const movieShare = total > 0 ? format.movie / total : 0.5;
  const out: TMDBSearchResult[] = [];
  let m = 0, t = 0;
  while (m < movies.length || t < shows.length) {
    const wantMovie = t >= shows.length || (m < movies.length && m / Math.max(m + t, 1) <= movieShare);
    out.push(wantMovie ? movies[m++] : shows[t++]);
  }
  return out;
}

export async function getMediaDetails(
  type: "movie" | "tv",
  tmdbId: number,
  signal?: AbortSignal,
): Promise<TMDBMediaDetails> {
  const data = await tmdbFetch(`/${type}/${tmdbId}`, {
    append_to_response: "videos,credits",
  }, signal);

  return {
    ...mapResult(data, type),
    genreIds: ((data.genres as { id: number }[]) || []).map((g) => g.id),
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
