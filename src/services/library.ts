import { supabase } from "@/lib/supabase";
import type { Entry, EntryStatus, MediaType } from "@/types";

interface AddEntryParams {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  status: EntryStatus;
  rating?: number | null;
  notes?: string;
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
      start_date: entry.startDate ?? null,
      finish_date: entry.finishDate ?? null,
    }, { onConflict: "user_id,tmdb_id,media_type" })
    .select()
    .single();

  if (error) throw error;
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
  updates: Partial<Pick<Entry, "status" | "rating" | "notes" | "progress" | "start_date" | "finish_date">>
): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select()
    .single();

  if (error) throw error;
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
