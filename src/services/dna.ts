import { supabase } from "@/lib/supabase";
import { getProfileByUsername, updateProfile } from "@/services/profile";
import type { UserDNA, WeightedMetric, ContextCoverage } from "@/types";

function asArr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asNum(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function normalizeDna(dna: UserDNA): UserDNA {
  return {
    ...dna,
    topGenres: asArr<WeightedMetric>(dna.topGenres),
    decadeDistribution: asArr<WeightedMetric>(dna.decadeDistribution),
    countryDistribution: asArr<WeightedMetric>(dna.countryDistribution),
    languageDistribution: asArr<WeightedMetric>(dna.languageDistribution),
    recurringDirectors: asArr(dna.recurringDirectors),
    recurringCast: asArr(dna.recurringCast),
    tags: asArr(dna.tags),
    venueDistribution: asArr<WeightedMetric>(dna.venueDistribution),
    timeDistribution: asArr<WeightedMetric>(dna.timeDistribution),
    companionshipDistribution: asArr<WeightedMetric>(dna.companionshipDistribution),
    languageModeDistribution: asArr<WeightedMetric>(dna.languageModeDistribution),
    platformDistribution: asArr<WeightedMetric>(dna.platformDistribution),
    reactionDistribution: asArr<WeightedMetric>(dna.reactionDistribution),
    contextTags: asArr(dna.contextTags),
    rewatchProfile: {
      totalSessions: asNum(dna.rewatchProfile?.totalSessions),
      uniqueTitles: asNum(dna.rewatchProfile?.uniqueTitles),
      rewatchSessions: asNum(dna.rewatchProfile?.rewatchSessions),
      rewatchRate: asNum(dna.rewatchProfile?.rewatchRate),
    },
    contextCoverage:
      dna.contextCoverage && typeof dna.contextCoverage === "object" && !Array.isArray(dna.contextCoverage)
        ? (dna.contextCoverage as ContextCoverage)
        : {},
  };
}

export interface UserDNARow {
  status: string;
  algorithm_version: number;
  valid_title_count: number;
  rated_title_count: number;
  confidence_score: number;
  summary: string | null;
  top_genres: UserDNA["topGenres"];
  format_distribution: UserDNA["formatDistribution"];
  decade_distribution: UserDNA["decadeDistribution"];
  country_distribution: UserDNA["countryDistribution"];
  language_distribution: UserDNA["languageDistribution"];
  runtime_profile: UserDNA["runtimeProfile"];
  rating_profile: UserDNA["ratingProfile"];
  recurring_directors: UserDNA["recurringDirectors"];
  recurring_cast: UserDNA["recurringCast"];
  tags: UserDNA["tags"];
  venue_distribution: UserDNA["venueDistribution"];
  time_distribution: UserDNA["timeDistribution"];
  companionship_distribution: UserDNA["companionshipDistribution"];
  language_mode_distribution: UserDNA["languageModeDistribution"];
  platform_distribution: UserDNA["platformDistribution"];
  reaction_distribution: UserDNA["reactionDistribution"];
  rewatch_profile: UserDNA["rewatchProfile"];
  context_tags: UserDNA["contextTags"];
  context_coverage: UserDNA["contextCoverage"];
  calculated_at: string;
  source_updated_at: string | null;
}

export function mapDnaRow(row: UserDNARow): UserDNA {
  return {
    status: row.status as UserDNA["status"],
    algorithmVersion: row.algorithm_version,
    validTitleCount: row.valid_title_count,
    ratedTitleCount: row.rated_title_count,
    confidenceScore: row.confidence_score,
    summary: row.summary,
    topGenres: row.top_genres ?? [],
    formatDistribution: row.format_distribution ?? { movie: 0, tv: 0 },
    decadeDistribution: row.decade_distribution ?? [],
    countryDistribution: row.country_distribution ?? [],
    languageDistribution: row.language_distribution ?? [],
    runtimeProfile: row.runtime_profile ?? { averageMinutes: null, label: null, coverage: 0 },
    ratingProfile: row.rating_profile ?? { average: null, median: null, distribution: {}, label: null, coverage: 0 },
    recurringDirectors: row.recurring_directors ?? [],
    recurringCast: row.recurring_cast ?? [],
    tags: row.tags ?? [],
    venueDistribution: row.venue_distribution ?? [],
    timeDistribution: row.time_distribution ?? [],
    companionshipDistribution: row.companionship_distribution ?? [],
    languageModeDistribution: row.language_mode_distribution ?? [],
    platformDistribution: row.platform_distribution ?? [],
    reactionDistribution: row.reaction_distribution ?? [],
    rewatchProfile: row.rewatch_profile ?? { totalSessions: 0, uniqueTitles: 0, rewatchSessions: 0, rewatchRate: 0 },
    contextTags: row.context_tags ?? [],
    contextCoverage: row.context_coverage ?? {},
    calculatedAt: row.calculated_at,
    sourceUpdatedAt: row.source_updated_at,
  };
}

export async function getMyDna(userId: string): Promise<UserDNA | null> {
  const { data, error } = await supabase
    .from("user_dna")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeDna(mapDnaRow(data as UserDNARow));
}

export async function calculateDna(force = false): Promise<UserDNA> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sesión no encontrada");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-user-dna${force ? "?force=true" : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error ?? "No pudimos actualizar tu ADN en este momento.");
  }
  return normalizeDna(body as UserDNA);
}

export async function getPublicDnaByUsername(username: string): Promise<UserDNA | null> {
  const profile = await getProfileByUsername(username);
  if (!profile) return null;

  const { data, error } = await supabase
    .from("user_dna")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeDna(mapDnaRow(data as UserDNARow));
}

export async function setDnaPublicVisibility(userId: string, visible: boolean): Promise<void> {
  await updateProfile(userId, { show_dna_publicly: visible });
}
