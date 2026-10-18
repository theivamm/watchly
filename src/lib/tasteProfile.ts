import type { WeightedMetric, TMDBSearchResult } from "@/types";
import type { TonightCandidate } from "./watchTonight";
import { genreLabel } from "./genres.ts";

export interface TasteProfile {
  genres: WeightedMetric[];
  evidence: Record<string, { title: string; rating: number }>;
  ratedCount: number;
}
const canonical = (id: number) => ({ 10759: 28, 10765: 878, 10768: 10752 }[id] ?? id);

export function buildTasteProfile(candidates: TonightCandidate[], fallback: WeightedMetric[]): TasteProfile {
  const totals = new Map<number, { sum: number; count: number }>();
  const evidence: TasteProfile["evidence"] = {};
  let ratedCount = 0;
  for (const { entry, details } of candidates) {
    const rating = entry.rating;
    if (entry.status === "want_to_watch" || rating == null || !Number.isFinite(rating) || rating < 0.5 || rating > 5 || !details?.genreIds.length) continue;
    ratedCount++;
    const ids = [...new Set(details.genreIds.map(canonical))];
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
  return { genres: genres.map((g) => ({ ...g, percentage: total ? g.weight / total * 100 : 0 })), evidence, ratedCount };
}

export function explainTaste(item: TMDBSearchResult, profile: TasteProfile): string {
  const ids = item.genreIds.map(canonical);
  const matching = profile.genres.find((g) => ids.includes(Number(g.key)));
  if (!matching) return "Para explorar algo distinto a tus géneros habituales; no es una afinidad confirmada.";
  const example = profile.evidence[matching.key];
  return example
    ? `Porque calificaste «${example.title}» con ${example.rating} de 5 estrellas y también tiene ${matching.label.toLowerCase()}.`
    : `Porque ${matching.label.toLowerCase()} aparece en tu ADN. Todavía no tenemos una valoración positiva tuya que lo confirme.`;
}

export function tasteScore(item: TMDBSearchResult, profile: TasteProfile): number {
  const ids = item.genreIds.map(canonical);
  return profile.genres.reduce((sum, genre) => sum + (ids.includes(Number(genre.key)) ? genre.weight : 0), 0);
}
