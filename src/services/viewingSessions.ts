import { supabase } from "@/lib/supabase";
import type { ViewingSession, ViewingSessionInput, MediaType } from "@/types";

function toRow(input: ViewingSessionInput) {
  return {
    tmdb_id: input.tmdbId,
    media_type: input.mediaType,
    watched_at: input.watchedAt ?? null,
    watched_date: input.watchedDate ?? null,
    timezone: input.timezone ?? null,
    venue: input.venue ?? "unknown",
    platform: input.platform ?? "unknown",
    provider_id: input.providerId ?? null,
    companionship: input.companionship ?? "unknown",
    language_mode: input.languageMode ?? "unknown",
    is_rewatch: input.isRewatch ?? false,
    scope: input.scope ?? "full_title",
    season_number: input.seasonNumber ?? null,
    episode_number: input.episodeNumber ?? null,
    rating: input.rating ?? null,
    notes: input.notes ?? null,
    is_public: input.isPublic ?? false,
  };
}

function toPartialRow(input: Partial<ViewingSessionInput>) {
  const row: Record<string, unknown> = {};
  if (input.watchedAt !== undefined) row.watched_at = input.watchedAt ?? null;
  if (input.watchedDate !== undefined) row.watched_date = input.watchedDate ?? null;
  if (input.timezone !== undefined) row.timezone = input.timezone ?? null;
  if (input.venue !== undefined) row.venue = input.venue ?? "unknown";
  if (input.platform !== undefined) row.platform = input.platform ?? "unknown";
  if (input.providerId !== undefined) row.provider_id = input.providerId ?? null;
  if (input.companionship !== undefined) row.companionship = input.companionship ?? "unknown";
  if (input.languageMode !== undefined) row.language_mode = input.languageMode ?? "unknown";
  if (input.isRewatch !== undefined) row.is_rewatch = input.isRewatch ?? false;
  if (input.scope !== undefined) row.scope = input.scope ?? "full_title";
  if (input.seasonNumber !== undefined) row.season_number = input.seasonNumber ?? null;
  if (input.episodeNumber !== undefined) row.episode_number = input.episodeNumber ?? null;
  if (input.rating !== undefined) row.rating = input.rating ?? null;
  if (input.notes !== undefined) row.notes = input.notes ?? null;
  if (input.isPublic !== undefined) row.is_public = input.isPublic ?? false;
  return row;
}

export async function addViewingSession(userId: string, input: ViewingSessionInput): Promise<ViewingSession> {
  const { data, error } = await supabase
    .from("viewing_sessions")
    .insert({ ...toRow(input), user_id: userId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getViewingSessions(userId: string, tmdbId: number, mediaType: MediaType): Promise<ViewingSession[]> {
  const { data, error } = await supabase
    .from("viewing_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .order("watched_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateViewingSession(sessionId: string, input: Partial<ViewingSessionInput>): Promise<ViewingSession> {
  const { data, error } = await supabase
    .from("viewing_sessions")
    .update({ ...toPartialRow(input), updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeViewingSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("viewing_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw error;
}
