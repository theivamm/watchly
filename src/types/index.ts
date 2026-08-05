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
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
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
  start_date: string | null;
  finish_date: string | null;
  created_at: string;
  updated_at: string;
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
