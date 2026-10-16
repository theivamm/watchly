import { loadTonightCandidates } from "@/services/tonight";
import { buildTasteProfile } from "@/lib/tasteProfile";
import type { Entry, WeightedMetric } from "@/types";

export async function getTasteProfile(entries: Entry[], fallback: WeightedMetric[]) {
  const rated = entries.filter((entry) => entry.rating != null && entry.status !== "want_to_watch");
  const candidates = await loadTonightCandidates(rated, new AbortController().signal, () => {});
  return buildTasteProfile(candidates, fallback);
}
