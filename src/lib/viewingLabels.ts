import {
  Clapperboard,
  Home,
  Users,
  Plane,
  MoreHorizontal,
  User,
  Heart,
  HeartHandshake,
  Baby,
  Subtitles,
  VolumeX,
  Mic,
  Play,
  Tv,
  CircleDollarSign,
  Disc,
  Download,
  Repeat,
  Sparkles,
  MapPin,
  Languages,
  MonitorPlay,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  ViewingVenue,
  ViewingPlatform,
  ViewingCompanionship,
  ViewingLanguageMode,
} from "@/types";

export interface ViewingPill {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const VENUE_PILLS: ViewingPill[] = [
  { value: "cinema", label: "Cine", icon: Clapperboard, color: "#FF8A5B" },
  { value: "home", label: "Mi casa", icon: Home, color: "#67B7FF" },
  { value: "friend_home", label: "Casa de un amigo", icon: Users, color: "#4DD8C8" },
  { value: "travel", label: "Viaje", icon: Plane, color: "#FFB547" },
  { value: "other", label: "Otro", icon: MoreHorizontal, color: "#94a3b8" },
];

export const COMPANIONSHIP_PILLS: ViewingPill[] = [
  { value: "alone", label: "Solo/a", icon: User, color: "#A78BFA" },
  { value: "partner", label: "En pareja", icon: Heart, color: "#FF6F9F" },
  { value: "friends", label: "Con amigos", icon: Users, color: "#67B7FF" },
  { value: "family", label: "Con familia", icon: HeartHandshake, color: "#FFB547" },
  { value: "children", label: "Con niños", icon: Baby, color: "#B7E45C" },
  { value: "other", label: "Otro", icon: MoreHorizontal, color: "#94a3b8" },
];

export const LANGUAGE_MODE_PILLS: ViewingPill[] = [
  { value: "original_subtitled", label: "Original con subtítulos", icon: Subtitles, color: "#4DD8C8" },
  { value: "original_no_subtitles", label: "Original sin subtítulos", icon: VolumeX, color: "#67B7FF" },
  { value: "dubbed", label: "Doblado", icon: Mic, color: "#A78BFA" },
];

export const PLATFORM_PILLS: ViewingPill[] = [
  { value: "streaming", label: "Streaming", icon: Play, color: "#67B7FF" },
  { value: "television", label: "Televisión", icon: Tv, color: "#A78BFA" },
  { value: "rental", label: "Alquiler", icon: CircleDollarSign, color: "#FFB547" },
  { value: "physical", label: "Físico", icon: Disc, color: "#FF6F9F" },
  { value: "download", label: "Descarga", icon: Download, color: "#B7E45C" },
  { value: "other", label: "Otro", icon: MoreHorizontal, color: "#94a3b8" },
];

export const REWATCH_PILLS: ViewingPill[] = [
  { value: "first", label: "Es la primera vez", icon: Sparkles, color: "#4DD8C8" },
  { value: "rewatch", label: "Ya la había visto", icon: Repeat, color: "#FF8A5B" },
];

export const HABIT_GROUPS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  venue: { label: "¿Dónde lo viste?", icon: MapPin, color: "#67B7FF" },
  companionship: { label: "¿Con quién?", icon: Users, color: "#FF6F9F" },
  language: { label: "Idioma", icon: Languages, color: "#4DD8C8" },
  platform: { label: "Plataforma", icon: MonitorPlay, color: "#FFB547" },
  rewatch: { label: "¿Ya la habías visto antes?", icon: Repeat, color: "#FF8A5B" },
};

export const HOW_YOU_WATCHED_HELP =
  "Este módulo registra el contexto de cada sesión: cuándo, dónde, con quién y en qué la viste, además de qué te dejó. " +
  "Con esos datos tu ADN Audiovisual descubre tus hábitos (franjas horarias, compañía, plataformas, rewatches) y las " +
  "reacciones que te generan las historias. Cada sesión se guarda como un registro nuevo y podés editarla o borrarla.";

export const VENUE_LABELS: Record<ViewingVenue, string> = {
  cinema: "Cine",
  home: "Mi casa",
  friend_home: "Casa de un amigo",
  travel: "Viaje",
  other: "Otro",
  unknown: "Sin registro",
};

export const PLATFORM_LABELS: Record<ViewingPlatform, string> = {
  streaming: "Streaming",
  television: "Televisión",
  rental: "Alquiler",
  physical: "Físico",
  download: "Descarga",
  other: "Otro",
  unknown: "Sin registro",
};

export const COMPANIONSHIP_LABELS: Record<ViewingCompanionship, string> = {
  alone: "Solo/a",
  partner: "En pareja",
  friends: "Con amigos",
  family: "Con familia",
  children: "Con niños",
  other: "Otro",
  unknown: "Sin registro",
};

export const LANGUAGE_MODE_LABELS: Record<ViewingLanguageMode, string> = {
  original_subtitled: "Original + subtítulos",
  original_no_subtitles: "Original sin subtítulos",
  dubbed: "Doblado",
  unknown: "Sin registro",
};

export const TIME_BUCKETS: { key: string; label: string; from: number; to: number }[] = [
  { key: "morning", label: "Mañana", from: 6, to: 11 },
  { key: "afternoon", label: "Tarde", from: 12, to: 18 },
  { key: "night", label: "Noche", from: 19, to: 23 },
  { key: "late_night", label: "Madrugada", from: 0, to: 5 },
];

export const TIME_LABELS: Record<string, string> = Object.fromEntries(
  TIME_BUCKETS.map((b) => [b.key, b.label])
);
