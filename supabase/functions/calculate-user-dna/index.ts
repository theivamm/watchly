import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ALGORITHM_VERSION,
  computeContext,
  computeDna,
  userDnaFromRow,
  type UserDNA,
  type ValidEntry,
  type MediaMetadata,
  type MediaType,
  type SessionRow,
  type ReactionRow,
} from "./_lib/dna.ts";
import { fetchMediaMetadata } from "./_lib/tmdb.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeStored(row: Record<string, unknown>): MediaMetadata {
  return {
    title: (row.title as string) ?? null,
    genres: (row.genres as number[]) ?? [],
    runtime: (row.runtime as number) ?? null,
    original_language: (row.original_language as string) ?? null,
    origin_countries: (row.origin_countries as string[]) ?? [],
    directors: (row.directors as string[]) ?? [],
    top_cast: (row.top_cast as string[]) ?? [],
    release_date: (row.release_date as string) ?? null,
  };
}

async function fetchWithConcurrency(
  pairs: { tmdb_id: number; media_type: MediaType }[],
  limit: number
): Promise<{ tmdb_id: number; media_type: MediaType; metadata: MediaMetadata }[]> {
  const results: { tmdb_id: number; media_type: MediaType; metadata: MediaMetadata }[] = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < pairs.length) {
      const pair = pairs[cursor++];
      try {
        const metadata = await fetchMediaMetadata(pair.media_type, pair.tmdb_id);
        results.push({ ...pair, metadata });
      } catch (err) {
        console.error(`No se pudo obtener metadata de ${pair.media_type}/${pair.tmdb_id}`, (err as Error).message);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, Math.max(pairs.length, 1)) }, worker));
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
      return json({ error: "Faltan variables de entorno" }, 500);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "No autorizado" }, 401);
    }
    const userId = user.id;

    const db = createClient(supabaseUrl, serviceKey);

    if (!force) {
      const { data: existing } = await db
        .from("user_dna")
        .select("calculated_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        const last = new Date((existing as { calculated_at: string }).calculated_at).getTime();
        if (Date.now() - last < 30_000) {
          const { data: row } = await db
            .from("user_dna")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          return json(userDnaFromRow((row as Record<string, unknown>) ?? null));
        }
      }
    }

    const { data: entries, error: entriesError } = await db
      .from("entries")
      .select("tmdb_id, media_type, status, rating, updated_at")
      .eq("user_id", userId)
      .or("status.eq.completed,and(status.eq.watching,media_type.eq.tv)");
    if (entriesError) throw entriesError;

    const validEntries = (entries ?? []) as ValidEntry[];

    const uniquePairs = Array.from(
      new Map(
        validEntries.map((e) => [
          `${e.media_type}:${e.tmdb_id}`,
          { tmdb_id: e.tmdb_id, media_type: e.media_type as MediaType },
        ])
      ).values()
    );

    const metadataMap = new Map<string, MediaMetadata>();
    const ids = uniquePairs.map((p) => p.tmdb_id);
    if (ids.length > 0) {
      for (let i = 0; i < ids.length; i += 400) {
        const chunk = ids.slice(i, i + 400);
        const { data: stored } = await db
          .from("media_metadata")
          .select("*")
          .in("tmdb_id", chunk);
        for (const row of (stored ?? []) as Record<string, unknown>[]) {
          metadataMap.set(`${row.media_type}:${row.tmdb_id}`, normalizeStored(row));
        }
      }

      const missing = uniquePairs.filter((p) => !metadataMap.has(`${p.media_type}:${p.tmdb_id}`));
      const fetched = await fetchWithConcurrency(missing, 3);
      for (const f of fetched) metadataMap.set(`${f.media_type}:${f.tmdb_id}`, f.metadata);

      if (fetched.length > 0) {
        const rows = fetched.map((f) => ({
          tmdb_id: f.tmdb_id,
          media_type: f.media_type,
          title: f.metadata.title,
          release_date: f.metadata.release_date,
          genres: f.metadata.genres,
          runtime: f.metadata.runtime,
          original_language: f.metadata.original_language,
          origin_countries: f.metadata.origin_countries,
          directors: f.metadata.directors,
          top_cast: f.metadata.top_cast,
          metadata_updated_at: new Date().toISOString(),
        }));
        const { error: upsertError } = await db
          .from("media_metadata")
          .upsert(rows, { onConflict: "tmdb_id,media_type" });
        if (upsertError) console.error("No se pudo guardar metadata", upsertError.message);
      }
    }

    const dna = computeDna(validEntries, metadataMap);

    const { data: sessionRows, error: sessionsError } = await db
      .from("viewing_sessions")
      .select("id, tmdb_id, media_type, watched_at, timezone, venue, platform, companionship, language_mode, is_rewatch, rating")
      .eq("user_id", userId);
    if (sessionsError) throw sessionsError;

    const rawSessions = (sessionRows ?? []) as Record<string, unknown>[];
    const sessions: SessionRow[] = rawSessions.map((r) => ({
      tmdb_id: r.tmdb_id as number,
      media_type: r.media_type as MediaType,
      watched_at: (r.watched_at as string | null) ?? null,
      timezone: (r.timezone as string | null) ?? null,
      venue: (r.venue as string) ?? "unknown",
      platform: (r.platform as string) ?? "unknown",
      companionship: (r.companionship as string) ?? "unknown",
      language_mode: (r.language_mode as string) ?? "unknown",
      is_rewatch: (r.is_rewatch as boolean) ?? false,
      rating: (r.rating as number | null) ?? null,
    }));

    let reactions: ReactionRow[] = [];
    if (rawSessions.length > 0) {
      const sessionIds = rawSessions.map((r) => r.id as string);
      const { data: reactionRows, error: reactionsError } = await db
        .from("viewing_session_reactions")
        .select("viewing_session_id, reaction_tags(slug, name)")
        .in("viewing_session_id", sessionIds);
      if (reactionsError) throw reactionsError;
      reactions = (reactionRows ?? []).flatMap((r) => {
        const tag = r.reaction_tags as { slug?: string; name?: string } | null;
        if (!tag?.slug) return [];
        return [{ viewing_session_id: r.viewing_session_id as string, slug: tag.slug, name: tag.name ?? tag.slug }] as ReactionRow[];
      });
    }

    const context = computeContext(sessions, reactions);
    const merged: UserDNA = { ...dna, ...context, algorithmVersion: ALGORITHM_VERSION };

    const { error: writeError } = await db.from("user_dna").upsert(
      {
        user_id: userId,
        status: dna.status,
        algorithm_version: dna.algorithmVersion,
        valid_title_count: dna.validTitleCount,
        rated_title_count: dna.ratedTitleCount,
        confidence_score: dna.confidenceScore,
        summary: dna.summary,
        top_genres: dna.topGenres,
        format_distribution: dna.formatDistribution,
        decade_distribution: dna.decadeDistribution,
        country_distribution: dna.countryDistribution,
        language_distribution: dna.languageDistribution,
        runtime_profile: dna.runtimeProfile,
        rating_profile: dna.ratingProfile,
        recurring_directors: dna.recurringDirectors,
        recurring_cast: dna.recurringCast,
        tags: dna.tags,
        venue_distribution: context.venueDistribution,
        time_distribution: context.timeDistribution,
        companionship_distribution: context.companionshipDistribution,
        language_mode_distribution: context.languageModeDistribution,
        platform_distribution: context.platformDistribution,
        reaction_distribution: context.reactionDistribution,
        rewatch_profile: context.rewatchProfile,
        context_tags: context.contextTags,
        context_coverage: context.contextCoverage,
        source_updated_at: dna.sourceUpdatedAt,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (writeError) throw writeError;

    await db
      .from("profiles")
      .update({ dna_dirty: false, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .maybeSingle();

    return json(merged as UserDNA);
  } catch (err) {
    console.error("calculate-user-dna error", err);
    return json({ error: "No pudimos actualizar tu ADN en este momento." }, 500);
  }
});
