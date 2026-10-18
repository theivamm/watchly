import type { WeightedMetric, TMDBSearchResult } from "@/types";
import type { TonightCandidate } from "./watchTonight";
import { genreLabel } from "./genres.ts";

export interface TasteProfile {
  genres: WeightedMetric[];
  evidence: Record<string, { title: string; rating: number }>;
  /** Títulos que calificaste con 4 o más, con sus géneros, para explicar cada recomendación. */
  loved: { title: string; rating: number; genres: number[] }[];
  ratedCount: number;
}
const canonical = (id: number) => ({ 10759: 28, 10765: 878, 10768: 10752 }[id] ?? id);

export function buildTasteProfile(candidates: TonightCandidate[], fallback: WeightedMetric[]): TasteProfile {
  const totals = new Map<number, { sum: number; count: number }>();
  const evidence: TasteProfile["evidence"] = {};
  const loved: TasteProfile["loved"] = [];
  let ratedCount = 0;
  for (const { entry, details } of candidates) {
    const rating = entry.rating;
    if (entry.status === "want_to_watch" || rating == null || !Number.isFinite(rating) || rating < 0.5 || rating > 5 || !details?.genreIds.length) continue;
    ratedCount++;
    const ids = [...new Set(details.genreIds.map(canonical))];
    if (rating >= 4) loved.push({ title: entry.title, rating, genres: ids });
    for (const id of ids) {
      const previous = totals.get(id) ?? { sum: 0, count: 0 };
      // 3 is neutral. Shrink towards neutral with two prior observations.
      totals.set(id, { sum: previous.sum + (rating - 3) / 2, count: previous.count + 1 });
      if (rating >= 4 && (!evidence[id] || evidence[id].rating < rating)) evidence[id] = { title: entry.title, rating };
    }
  }
  const base = new Map(fallback.map((g) => [canonical(Number(g.key)), g]));
  const keys = new Set([...base.keys(), ...totals.keys()]);
  const genres = [...keys].map((id) => {
    const observations = totals.get(id);
    const baseline = Math.max(0, base.get(id)?.percentage ?? 0) / 100 * 0.15;
    const affinity = observations ? observations.sum / (observations.count + 2) : 0;
    return { key: String(id), label: genreLabel([id], 1) || base.get(id)?.label || "Otros", weight: Math.max(0, affinity + baseline), percentage: 0 };
  }).filter((g) => g.weight > 0).sort((a, b) => b.weight - a.weight);
  const total = genres.reduce((sum, g) => sum + g.weight, 0);
  return { genres: genres.map((g) => ({ ...g, percentage: total ? g.weight / total * 100 : 0 })), evidence, loved, ratedCount };
}

const lower = (id: number) => (genreLabel([id], 1) || "").toLowerCase();
const joinEs = (parts: string[]) => parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
const stars = (r: number) => `${r} ${r === 1 ? "estrella" : "estrellas"}`;

/**
 * Explica una recomendación con el título que calificaste alto que más géneros comparte con ella.
 * Entre empates rota según el título recomendado, así una misma fila no repite siempre el mismo ejemplo.
 */
export function explainTaste(item: TMDBSearchResult, profile: TasteProfile, focusGenre?: string): string {
  const ids = [...new Set(item.genreIds.map(canonical))];
  const focus = focusGenre ? canonical(Number(focusGenre)) : null;
  const seed = item.tmdbId;

  const scored = (profile.loved ?? [])
    .map((l) => ({ ...l, shared: l.genres.filter((g) => ids.includes(g)) }))
    .filter((l) => l.shared.length > 0 && (focus == null || l.shared.includes(focus)) && l.title !== item.title)
    .sort((a, b) => b.shared.length - a.shared.length || b.rating - a.rating);

  if (scored.length > 0) {
    const best = scored[0].shared.length;
    const ties = scored.filter((l) => l.shared.length === best && l.rating >= scored[0].rating - 0.5);
    const pick = ties[seed % ties.length];
    const shared = joinEs(pick.shared.slice(0, 3).map(lower).filter(Boolean));
    const variants = pick.shared.length >= 2
      ? [
          `Comparte ${shared} con «${pick.title}», que calificaste con ${stars(pick.rating)}.`,
          `Tiene la mezcla de ${shared} de «${pick.title}» (le diste ${stars(pick.rating)}).`,
        ]
      : [
          `Si te gustó «${pick.title}» (${stars(pick.rating)}), esta también es de ${shared}.`,
          `Le diste ${stars(pick.rating)} a «${pick.title}»; esta va por el mismo lado: ${shared}.`,
        ];
    return variants[seed % variants.length];
  }

  const matching = focus != null
    ? profile.genres.find((g) => Number(g.key) === focus)
    : profile.genres.find((g) => ids.includes(Number(g.key)));
  if (!matching) return "Para explorar algo distinto a tus géneros habituales; no es una afinidad confirmada.";
  return `Porque ${matching.label.toLowerCase()} es uno de los géneros que más aparecen en tu ADN. Calificá títulos de este género para afinar la recomendación.`;
}

export function tasteScore(item: TMDBSearchResult, profile: TasteProfile): number {
  const ids = item.genreIds.map(canonical);
  return profile.genres.reduce((sum, genre) => sum + (ids.includes(Number(genre.key)) ? genre.weight : 0), 0);
}
