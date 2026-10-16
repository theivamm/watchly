import { getMediaDetails } from "@/services/tmdb";
import type { Entry, TMDBMediaDetails } from "@/types";
import type { TonightCandidate } from "@/lib/watchTonight";

// Only public catalog metadata is cached; personal library data stays in the page.
const cache = new Map<string, { expires: number; value: Promise<TMDBMediaDetails> }>();
function metadata(entry: Entry) {
  const key = `${entry.media_type}:${entry.tmdb_id}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const value = getMediaDetails(entry.media_type, entry.tmdb_id, AbortSignal.timeout(15_000)).catch((error) => {
    cache.delete(key);
    throw error;
  });
  if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 30 * 60_000, value });
  return value;
}

export async function loadTonightCandidates(entries: Entry[], signal: AbortSignal, progress: (done: number) => void): Promise<TonightCandidate[]> {
  const results: TonightCandidate[] = [];
  let index = 0;
  // Bound concurrency even for large libraries. Stop scheduling after navigation.
  await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
    while (index < entries.length && !signal.aborted) {
      const entry = entries[index++];
      const details = await metadata(entry).catch(() => null);
      if (signal.aborted) return;
      results.push({ entry, details });
      progress(results.length);
    }
  }));
  return results;
}
