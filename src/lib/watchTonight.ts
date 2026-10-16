import type { Entry, TMDBMediaDetails } from "@/types";

export const tonightModes = [
  { id: "surprise", label: "Sorprendeme", hint: "Algo que ya querías ver" },
  { id: "quick", label: "Algo rápido", hint: "Películas de hasta 90 minutos" },
  { id: "comedy", label: "Quiero reírme", hint: "Comedias de tu biblioteca" },
  { id: "tension", label: "Quiero tensión", hint: "Thriller, misterio o terror" },
  { id: "together", label: "Para compartir", hint: "Comedia, aventura o familia" },
  { id: "continue", label: "Seguir una serie", hint: "Retomá una que estás viendo" },
] as const;
export type TonightMode = typeof tonightModes[number]["id"];
export interface TonightFilters {
  mode: TonightMode;
  format: "all" | "movie" | "tv";
  minutes: number | null;
  avoidHorror: boolean;
}
export interface TonightCandidate { entry: Entry; details: TMDBMediaDetails | null }

export function eligibleEntry(entry: Entry, filters: TonightFilters): boolean {
  if (filters.mode === "continue") return entry.status === "watching" && entry.media_type === "tv";
  return entry.status === "want_to_watch" &&
    (filters.mode !== "quick" || entry.media_type === "movie") &&
    (filters.format === "all" || entry.media_type === filters.format);
}

export function candidateReason(candidate: TonightCandidate, filters: TonightFilters): string | null {
  const { entry, details } = candidate;
  if (!eligibleEntry(entry, filters)) return null;
  const genres = details?.genreIds ?? [];
  const reasons = [filters.mode === "continue" ? "Ya la estás viendo" : "Está en tus pendientes"];
  const max = filters.mode === "quick" ? Math.min(filters.minutes ?? 90, 90) : filters.minutes;
  // A TV runtime is not a reliable duration for the next unwatched episode.
  if (max !== null) {
    if (entry.media_type !== "movie" || !details?.runtime || !Number.isFinite(details.runtime) || details.runtime <= 0 || details.runtime > max) return null;
    reasons.push(`${details.runtime} min: entra en tu tiempo`);
  }
  if (filters.avoidHorror && (!genres.length || genres.includes(27))) return null;
  const required = filters.mode === "comedy" ? [35] : filters.mode === "tension" ? [53, 9648, 27] : filters.mode === "together" ? [35, 12, 10759, 10751] : [];
  if (required.length && !required.some((id) => genres.includes(id))) return null;
  if (required.length) reasons.push(filters.mode === "comedy" ? "Es una comedia" : filters.mode === "tension" ? "Tiene misterio, thriller o terror" : "Tiene comedia, aventura o familia");
  return reasons.join(" · ");
}

export function pickTonight(candidates: TonightCandidate[], filters: TonightFilters, dismissed: Set<string>, random = Math.random) {
  const pool = candidates.flatMap((candidate) => {
    const reason = candidateReason(candidate, filters);
    return reason && !dismissed.has(candidate.entry.id) ? [{ ...candidate, reason }] : [];
  });
  // Sample without replacement. No score implies a promise about personal taste.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
