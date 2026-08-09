export type Theme = "dark" | "light" | "system";

export type AccentColor =
  | "coral"
  | "amber"
  | "sunset"
  | "rose"
  | "violet"
  | "aqua"
  | "lime"
  | "sky";

export type MediaType = "movie" | "tv";

export type WatchStatus =
  | "watchlist"
  | "watching"
  | "completed"
  | "paused"
  | "dropped";

export type DNAStatus = "locked" | "early" | "developing" | "solid" | "rich";

export interface WeightedMetric {
  key: string;
  label: string;
  weight: number;
  percentage: number;
}

export interface CreatorMetric {
  name: string;
  count: number;
}

export interface RewatchProfile {
  totalSessions: number;
  uniqueTitles: number;
  rewatchSessions: number;
  rewatchRate: number;
}

export interface ContextTag {
  slug: string;
  label: string;
  score: number;
  sampleSize: number;
  ruleVersion: string;
  explanation: string;
}

export interface ContextCoverageItem {
  sessions: number;
  label: string;
  level: string;
}

export type ContextCoverage = Record<string, ContextCoverageItem>;

export interface UserDNA {
  status: DNAStatus;
  algorithmVersion: number;
  validTitleCount: number;
  ratedTitleCount: number;
  confidenceScore: number;
  summary: string | null;
  topGenres: WeightedMetric[];
  formatDistribution: { movie: number; tv: number };
  decadeDistribution: WeightedMetric[];
  countryDistribution: WeightedMetric[];
  languageDistribution: WeightedMetric[];
  runtimeProfile: {
    averageMinutes: number | null;
    label: string | null;
    coverage: number;
  };
  ratingProfile: {
    average: number | null;
    median: number | null;
    distribution: Record<string, number>;
    label: string | null;
    coverage: number;
  };
  recurringDirectors: CreatorMetric[];
  recurringCast: CreatorMetric[];
  tags: string[];
  venueDistribution: WeightedMetric[];
  timeDistribution: WeightedMetric[];
  companionshipDistribution: WeightedMetric[];
  languageModeDistribution: WeightedMetric[];
  platformDistribution: WeightedMetric[];
  reactionDistribution: WeightedMetric[];
  rewatchProfile: RewatchProfile;
  contextTags: ContextTag[];
  contextCoverage: ContextCoverage;
  calculatedAt: string;
  sourceUpdatedAt: string | null;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_path: string | null;
  location: string | null;
  website_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  theme_preference: Theme;
  accent_color: AccentColor;
  is_profile_public: boolean;
  show_dna_publicly: boolean;
  dna_dirty: boolean;
  avatar_id: number | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAvatar {
  id: number;
  name: string;
  slug: string;
  style: string;
  seed: string;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Media {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  genres: number[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserMedia {
  id: string;
  user_id: string;
  media_id: string;
  media?: Media;
  status: WatchStatus;
  rating: number | null;
  review: string | null;
  is_favorite: boolean;
  is_public: boolean;
  current_season: number | null;
  current_episode: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export interface ListWithItems extends List {
  items: ListItem[];
}

export interface ProfileFeaturedMedia {
  id: string;
  user_id: string;
  media_id: string;
  media?: Media;
  media_type: MediaType;
  position: number;
  created_at: string;
}

export interface TMDBSearchResult {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  year: number | null;
  releaseDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  genreIds: number[];
  tmdbRating: number | null;
}

export interface TMDBMediaDetails extends TMDBSearchResult {
  genres: string[];
  runtime: number | null;
  voteCount: number;
  videos: { name?: string; key?: string; site?: string }[];
  cast: { name: string }[];
}

export interface AccentConfig {
  key: AccentColor;
  name: string;
  dark: string;
  light: string;
  personality: string;
}

export const ACCENTS: AccentConfig[] = [
  { key: "coral", name: "Coral", dark: "#FF766C", light: "#D94B43", personality: "Cálido y social" },
  { key: "amber", name: "Ámbar", dark: "#FFB547", light: "#B96B00", personality: "Cinematográfico" },
  { key: "sunset", name: "Atardecer", dark: "#FF8A5B", light: "#C95125", personality: "Enérgico" },
  { key: "rose", name: "Rosa", dark: "#FF6F9F", light: "#C73B70", personality: "Expresivo" },
  { key: "violet", name: "Violeta", dark: "#A78BFA", light: "#7252C7", personality: "Creativo" },
  { key: "aqua", name: "Aqua", dark: "#4DD8C8", light: "#087F75", personality: "Fresco" },
  { key: "lime", name: "Lima", dark: "#B7E45C", light: "#587B12", personality: "Colorido" },
  { key: "sky", name: "Cielo", dark: "#67B7FF", light: "#216EAD", personality: "Claro y moderno" },
];

export type EntryStatus = "want_to_watch" | "watching" | "completed" | "paused" | "dropped";

export interface Entry {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  status: EntryStatus;
  rating: number | null;
  progress: Record<string, unknown>;
  notes: string | null;
  description: string | null;
  start_date: string | null;
  finish_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ViewingVenue =
  | "cinema"
  | "home"
  | "friend_home"
  | "travel"
  | "other"
  | "unknown";

export type ViewingPlatform =
  | "streaming"
  | "television"
  | "rental"
  | "physical"
  | "download"
  | "other"
  | "unknown";

export type ViewingCompanionship =
  | "alone"
  | "partner"
  | "friends"
  | "family"
  | "children"
  | "other"
  | "unknown";

export type ViewingLanguageMode =
  | "original_subtitled"
  | "dubbed"
  | "original_no_subtitles"
  | "unknown";

export type ViewingScope = "full_title" | "season" | "viewing_session";

export interface ViewingSession {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  watched_at: string | null;
  watched_date: string | null;
  timezone: string | null;
  venue: ViewingVenue;
  platform: ViewingPlatform;
  provider_id: string | null;
  companionship: ViewingCompanionship;
  language_mode: ViewingLanguageMode;
  is_rewatch: boolean;
  scope: ViewingScope;
  season_number: number | null;
  episode_number: number | null;
  rating: number | null;
  notes: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ViewingSessionInput {
  tmdbId: number;
  mediaType: MediaType;
  watchedAt?: string | null;
  watchedDate?: string | null;
  timezone?: string | null;
  venue?: ViewingVenue;
  platform?: ViewingPlatform;
  providerId?: string | null;
  companionship?: ViewingCompanionship;
  languageMode?: ViewingLanguageMode;
  isRewatch?: boolean;
  scope?: ViewingScope;
  seasonNumber?: number | null;
  episodeNumber?: number | null;
  rating?: number | null;
  notes?: string | null;
  isPublic?: boolean;
}

export interface ReactionTag {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export const REACTION_TAGS: ReactionTag[] = [
  { id: "made_me_laugh", slug: "made_me_laugh", name: "Me hizo reír", is_active: true, created_at: "" },
  { id: "moved_me", slug: "moved_me", name: "Me emocionó", is_active: true, created_at: "" },
  { id: "surprised_me", slug: "surprised_me", name: "Me sorprendió", is_active: true, created_at: "" },
  { id: "made_me_think", slug: "made_me_think", name: "Me dejó pensando", is_active: true, created_at: "" },
  { id: "unsettled_me", slug: "unsettled_me", name: "Me inquietó", is_active: true, created_at: "" },
  { id: "disappointed_me", slug: "disappointed_me", name: "Me decepcionó", is_active: true, created_at: "" },
  { id: "made_me_nostalgic", slug: "made_me_nostalgic", name: "Me dio nostalgia", is_active: true, created_at: "" },
  { id: "hooked_me", slug: "hooked_me", name: "Me atrapó", is_active: true, created_at: "" },
  { id: "hard_to_finish", slug: "hard_to_finish", name: "Me costó terminarla", is_active: true, created_at: "" },
  { id: "want_to_rewatch", slug: "want_to_rewatch", name: "Quiero volver a verla", is_active: true, created_at: "" },
];

export type ReactionSlug = (typeof REACTION_TAGS)[number]["slug"];

export interface SessionReaction {
  viewing_session_id: string;
  reaction_tag_id: string;
  reaction_slug: string;
  reaction_name: string;
  created_at: string;
}

export const RESERVED_USERNAMES = [
  "admin",
  "login",
  "registro",
  "settings",
  "api",
  "explore",
  "search",
  "watchly",
];
