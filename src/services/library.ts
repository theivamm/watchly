import { supabase } from "@/lib/supabase";
import { track } from "@/lib/telemetry";
import type { Entry, EntryStatus, MediaType, TMDBSearchResult } from "@/types";

/** Insert a discovery without overwriting a title saved in another tab. */
export async function saveDiscovery(userId: string, item: TMDBSearchResult, status: "want_to_watch" | "watching"): Promise<Entry> {
  const { data, error } = await supabase.from("entries").upsert({
    user_id: userId, tmdb_id: item.tmdbId, media_type: item.mediaType,
    title: item.title, poster_path: item.posterPath, description: item.overview, status,
  }, { onConflict: "user_id,tmdb_id,media_type", ignoreDuplicates: true }).select().maybeSingle();
  if (error) throw error;
  if (data) {
    track("library_add", { media_type: item.mediaType, status, source: "tonight_dna" });
    return data;
  }
  const existing = await getEntry(userId, item.tmdbId, item.mediaType);
  if (!existing) throw new Error("No pudimos confirmar el guardado. Intentá de nuevo.");
  return existing;
}

interface AddEntryParams {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  status: EntryStatus;
  rating?: number | null;
  notes?: string;
  description?: string;
  startDate?: string | null;
  finishDate?: string | null;
}

export async function addToLibrary(userId: string, entry: AddEntryParams): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .upsert({
      user_id: userId,
      tmdb_id: entry.tmdbId,
      media_type: entry.mediaType,
      title: entry.title,
      poster_path: entry.posterPath,
      status: entry.status,
      rating: entry.rating ?? null,
      notes: entry.notes ?? null,
      description: entry.description ?? null,
      start_date: entry.startDate ?? null,
      finish_date: entry.finishDate ?? null,
    }, { onConflict: "user_id,tmdb_id,media_type" })
    .select()
    .single();

  if (error) {
    track("library_write_failed", { op: "add", code: error.code });
    throw error;
  }
  track("library_add", { media_type: entry.mediaType, status: entry.status });
  return data;
}

export async function getUserLibrary(
  userId: string,
  filters?: { status?: EntryStatus; mediaType?: MediaType }
): Promise<Entry[]> {
  let query = supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.mediaType) {
    query = query.eq("media_type", filters.mediaType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPublicLibrary(userId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateEntry(
  entryId: string,
  updates: Partial<Pick<Entry, "status" | "rating" | "notes" | "description" | "progress" | "start_date" | "finish_date">>
): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    track("library_write_failed", { op: "update", code: error.code });
    throw error;
  }
  return data;
}

export async function removeFromLibrary(entryId: string): Promise<void> {
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
}

export async function getEntry(
  userId: string,
  tmdbId: number,
  mediaType: MediaType
): Promise<Entry | null> {
  const { data, error } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) throw error;
  return data;
}
