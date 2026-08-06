import type { MediaMetadata, MediaType } from "./dna.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function fetchMediaMetadata(
  type: MediaType,
  tmdbId: number
): Promise<MediaMetadata> {
  const token = Deno.env.get("TMDB_API_READ_TOKEN");
  if (!token) throw new Error("TMDB_API_READ_TOKEN no configurado");

  const url = `${TMDB_BASE}/${type}/${tmdbId}?language=es-AR&append_to_response=credits`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${type}/${tmdbId}: ${res.status}`);

  const data = await res.json();
  const credits = data.credits ?? {};
  const productionCountries: string[] = (data.production_countries ?? []).map(
    (c: { iso_3166_1: string }) => c.iso_3166_1
  );
  const originCountry: string[] = data.origin_country ?? [];
  const rawRuntime = type === "movie" ? data.runtime : (data.episode_run_time ?? [])[0];

  return {
    title: (data.title as string) || (data.name as string) || null,
    genres: (data.genres ?? []).map((g: { id: number }) => g.id),
    runtime: typeof rawRuntime === "number" && rawRuntime > 0 ? rawRuntime : null,
    original_language: (data.original_language as string) ?? null,
    origin_countries: [...new Set([...productionCountries, ...originCountry])],
    directors: (credits.crew ?? [])
      .filter((c: { job: string }) => c.job === "Director")
      .map((c: { name: string }) => c.name),
    top_cast: (credits.cast ?? []).slice(0, 10).map((c: { name: string }) => c.name),
    release_date: (data.release_date as string) || (data.first_air_date as string) || null,
  };
}
