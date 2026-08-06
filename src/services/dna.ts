import { supabase } from "@/lib/supabase";
import { getProfileByUsername, updateProfile } from "@/services/profile";
import type { UserDNA } from "@/types";

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
  return mapDnaRow(data as UserDNARow);
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
  return body as UserDNA;
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
  return mapDnaRow(data as UserDNARow);
}

export async function setDnaPublicVisibility(userId: string, visible: boolean): Promise<void> {
  await updateProfile(userId, { show_dna_publicly: visible });
}
