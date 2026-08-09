import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, Star, ListPlus, ListIcon, ChevronDown, Check, Sparkles, Quote, Share2, CalendarDays, MapPin, Users, Languages, MonitorPlay, Repeat, Trash2, Pencil, Plus } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getPosterUrl, getMediaDetails } from "@/services/tmdb";
import { addToLibrary, updateEntry, removeFromLibrary, getEntry } from "@/services/library";
import { getUserLists, addItemToList, createList, getListsContainingItem } from "@/services/lists";
import { addViewingSession, getViewingSessions, removeViewingSession, updateViewingSession } from "@/services/viewingSessions";
import { getReactionTags, getSessionReactions, addReaction, removeReaction } from "@/services/reactions";
import type { TMDBSearchResult, Entry, EntryStatus, MediaType, List, TMDBMediaDetails, ViewingSession, ViewingVenue, ViewingPlatform, ViewingCompanionship, ViewingLanguageMode, ReactionTag } from "@/types";

interface MediaDetailModalProps {
  result: TMDBSearchResult;
  onClose: () => void;
  onSaved?: (entry: Entry) => void;
  shareUrl?: string | null;
  readOnlyEntry?: Entry | null;
}

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: "want_to_watch", label: "Quiero ver" },
  { value: "watching", label: "Viendo" },
  { value: "completed", label: "Completado" },
  { value: "paused", label: "Pausado" },
  { value: "dropped", label: "Abandonado" },
];

const STATUS_LABELS: Record<EntryStatus, string> = {
  want_to_watch: "Quiero ver",
  watching: "Viendo",
  completed: "Completado",
  paused: "Pausado",
  dropped: "Abandonado",
};

const STATUS_COLORS: Record<EntryStatus, string> = {
  want_to_watch: "var(--accent)",
  watching: "#4ade80",
  completed: "#60a5fa",
  paused: "#facc15",
  dropped: "#f87171",
};

const VENUES: { value: ViewingVenue; label: string }[] = [
  { value: "cinema", label: "Cine" },
  { value: "home", label: "Mi casa" },
  { value: "friend_home", label: "Casa de un amigo" },
  { value: "travel", label: "Viaje" },
  { value: "other", label: "Otro" },
];

const PLATFORMS: { value: ViewingPlatform; label: string }[] = [
  { value: "streaming", label: "Streaming" },
  { value: "television", label: "Televisión" },
  { value: "rental", label: "Alquiler" },
  { value: "physical", label: "Físico" },
  { value: "download", label: "Descarga" },
  { value: "other", label: "Otro" },
];

const COMPANIONSHIP: { value: ViewingCompanionship; label: string }[] = [
  { value: "alone", label: "Solo/a" },
  { value: "partner", label: "En pareja" },
  { value: "friends", label: "Con amigos" },
  { value: "family", label: "Con familia" },
  { value: "children", label: "Con niños" },
  { value: "other", label: "Otro" },
];

const LANGUAGE_MODES: { value: ViewingLanguageMode; label: string }[] = [
  { value: "original_subtitled", label: "Idioma original con subtítulos" },
  { value: "original_no_subtitles", label: "Idioma original sin subtítulos" },
  { value: "dubbed", label: "Doblado" },
];

const VENUE_LABELS: Record<ViewingVenue, string> = {
  cinema: "Cine",
  home: "Mi casa",
  friend_home: "Casa de un amigo",
  travel: "Viaje",
  other: "Otro",
  unknown: "Sin registro",
};

const PLATFORM_LABELS: Record<ViewingPlatform, string> = {
  streaming: "Streaming",
  television: "Televisión",
  rental: "Alquiler",
  physical: "Físico",
  download: "Descarga",
  other: "Otro",
  unknown: "Sin registro",
};

const COMPANIONSHIP_LABELS: Record<ViewingCompanionship, string> = {
  alone: "Solo/a",
  partner: "En pareja",
  friends: "Con amigos",
  family: "Con familia",
  children: "Con niños",
  other: "Otro",
  unknown: "Sin registro",
};

const LANGUAGE_MODE_LABELS: Record<ViewingLanguageMode, string> = {
  original_subtitled: "Original + subtítulos",
  original_no_subtitles: "Original sin subtítulos",
  dubbed: "Doblado",
  unknown: "Sin registro",
};

const emptyDraft = () => ({
  watchedDate: "",
  venue: "unknown" as ViewingVenue,
  platform: "unknown" as ViewingPlatform,
  companionship: "unknown" as ViewingCompanionship,
  languageMode: "unknown" as ViewingLanguageMode,
  isRewatch: false,
});

const glass = {
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(28px) saturate(150%)",
  WebkitBackdropFilter: "blur(28px) saturate(150%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.3)",
} as const;

function wallClockFromUtc(isoUtc: string, tz: string): string {
  try {
    const dt = new Date(isoUtc);
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: tz || undefined,
    }).formatToParts(dt);
    const h = parts.find((p) => (p.type as string) === "hour")?.value ?? "00";
    const m = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

export default function MediaDetailModal({ result, onClose, onSaved, shareUrl, readOnlyEntry }: MediaDetailModalProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<EntryStatus>("want_to_watch");
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState(result.overview || "");
  const [existingEntry, setExistingEntry] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [listsContaining, setListsContaining] = useState<Set<string>>(new Set());
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedToListId, setAddedToListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [fetchingDesc, setFetchingDesc] = useState(false);
  const [copied, setCopied] = useState(false);
  const [details, setDetails] = useState<TMDBMediaDetails | null>(null);
  const [sessions, setSessions] = useState<ViewingSession[]>([]);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [timeValue, setTimeValue] = useState("");
  const [tzValue, setTzValue] = useState(() =>
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""
  );
  const [sessionRating, setSessionRating] = useState<number>(0);
  const [sessionHover, setSessionHover] = useState<number>(0);
  const [reactionTags, setReactionTags] = useState<ReactionTag[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [selectedReactions, setSelectedReactions] = useState<string[]>([]);
  const [savingSession, setSavingSession] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isReadOnly = !!readOnlyEntry;
  const memberLists = lists.filter((list) => listsContaining.has(list.id));

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const posterUrl = getPosterUrl(result.posterPath, "w500");

  useEffect(() => {
    if (!user || isReadOnly) {
      setLoading(false);
      return;
    }
    getEntry(user.id, result.tmdbId, result.mediaType as MediaType)
      .then((entry) => {
        if (entry) {
          setExistingEntry(entry);
          setStatus(entry.status);
          setRating(entry.rating ?? 0);
          setNotes(entry.notes ?? "");
          setDescription(entry.description ?? result.overview ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [user, result.tmdbId, result.mediaType, isReadOnly]);

  useEffect(() => {
    if (!isReadOnly) {
      setDescription(result.overview || "");
      return;
    }
    setDescription(readOnlyEntry!.description || "");
    let active = true;
    getMediaDetails(readOnlyEntry!.media_type, readOnlyEntry!.tmdb_id)
      .then((d) => {
        if (!active) return;
        setDetails(d);
        if (!readOnlyEntry!.description) setDescription(d.overview);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [readOnlyEntry, isReadOnly, result.overview]);

  const fillDescription = async () => {
    if (fetchingDesc) return;
    setFetchingDesc(true);
    try {
      let desc = result.overview;
      if (!desc) {
        const details = await getMediaDetails(result.mediaType as "movie" | "tv", result.tmdbId);
        desc = details.overview;
      }
      setDescription(desc || "");
    } catch {
      /* ignore */
    } finally {
      setFetchingDesc(false);
    }
  };

  useEffect(() => {
    if (!user || isReadOnly) return;
    getUserLists(user.id).then(setLists).catch(console.error);
    getListsContainingItem(user.id, result.tmdbId, result.mediaType as MediaType)
      .then((ids) => setListsContaining(new Set(ids)))
      .catch(console.error);
  }, [user, isReadOnly, result.tmdbId, result.mediaType]);

  useEffect(() => {
    if (!user || isReadOnly || sessionsLoaded) return;
    getViewingSessions(user.id, result.tmdbId, result.mediaType as MediaType)
      .then((rows) => setSessions(rows))
      .catch(console.error)
      .finally(() => setSessionsLoaded(true));
  }, [user, isReadOnly, result.tmdbId, result.mediaType, sessionsLoaded]);

  useEffect(() => {
    if (!user || isReadOnly || tagsLoaded) return;
    getReactionTags()
      .then((rows) => setReactionTags(rows))
      .catch(console.error)
      .finally(() => setTagsLoaded(true));
  }, [user, isReadOnly, tagsLoaded]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowListDropdown(false);
      }
    };
    if (showListDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showListDropdown]);

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    try {
      let entry: Entry;
      if (existingEntry) {
        entry = await updateEntry(existingEntry.id, {
          status,
          rating: rating || null,
          notes: notes || undefined,
          description: description || undefined,
        });
      } else {
        entry = await addToLibrary(user.id, {
          tmdbId: result.tmdbId,
          mediaType: result.mediaType as MediaType,
          title: result.title,
          posterPath: result.posterPath,
          status,
          rating: rating || null,
          notes: notes || undefined,
          description: description || undefined,
        });
      }
      onSaved?.(entry);
      onClose();
    } catch (err) {
      console.error("Failed to save entry:", err);
      setSaveError("No se pudo guardar. ¿Iniciaste sesión? Revisá tu conexión e intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existingEntry) return;
    setSaving(true);
    setSaveError("");
    try {
      await removeFromLibrary(existingEntry.id);
      onSaved?.(null as unknown as Entry);
      onClose();
    } catch (err) {
      console.error("Failed to remove entry:", err);
      setSaveError("No se pudo eliminar. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddToList = async (listId: string) => {
    setAddingToList(listId);
    try {
      await addItemToList(listId, {
        tmdb_id: result.tmdbId,
        media_type: result.mediaType as MediaType,
        title: result.title,
        poster_path: result.posterPath,
      });
      setAddedToListId(listId);
      setListsContaining((prev) => new Set(prev).add(listId));
      setTimeout(() => {
        setShowListDropdown(false);
        setAddedToListId(null);
      }, 1200);
    } catch (err) {
      console.error("Failed to add to list:", err);
    } finally {
      setAddingToList(null);
    }
  };

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;
    setCreatingList(true);
    try {
      const list = await createList(user.id, { name: newListName.trim() });
      setLists((prev) => [list, ...prev]);
      setNewListName("");
      await handleAddToList(list.id);
    } catch (err) {
      console.error("Failed to create list:", err);
    } finally {
      setCreatingList(false);
    }
  };

  const loadSessionReactions = async (sessionId: string) => {
    if (!user) return;
    const rows = await getSessionReactions(sessionId).catch(() => []);
    setSelectedReactions(rows.map((r) => r.reaction_slug));
  };

  const startEditSession = (session: ViewingSession) => {
    setEditingSessionId(session.id);
    setDraft({
      watchedDate: session.watched_date ?? "",
      venue: session.venue,
      platform: session.platform,
      companionship: session.companionship,
      languageMode: session.language_mode,
      isRewatch: session.is_rewatch,
    });
    setTzValue(session.timezone ?? (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""));
    setTimeValue(session.watched_at ? wallClockFromUtc(session.watched_at, session.timezone ?? "") : "");
    setSessionRating(session.rating ?? 0);
    loadSessionReactions(session.id);
    setSessionError("");
  };

  const resetSessionDraft = () => {
    setEditingSessionId(null);
    setDraft(emptyDraft());
    setTimeValue("");
    setSessionRating(0);
    setSelectedReactions([]);
    setSessionError("");
  };

  const toggleReaction = async (tag: ReactionTag) => {
    if (!user || !editingSessionId || savingSession) return;
    const isSelected = selectedReactions.includes(tag.slug);
    const willExceed = !isSelected && selectedReactions.length >= 3;
    if (willExceed) {
      setSessionError("Podés elegir hasta 3 reacciones.");
      return;
    }
    setSavingSession(true);
    setSessionError("");
    try {
      if (isSelected) {
        await removeReaction(editingSessionId, tag.id);
        setSelectedReactions((prev) => prev.filter((s) => s !== tag.slug));
      } else {
        await addReaction(editingSessionId, tag.id);
        setSelectedReactions((prev) => [...prev, tag.slug]);
      }
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
      setSessionError("No se pudo actualizar la reacción. Confirmá que elegiste hasta 3.");
    } finally {
      setSavingSession(false);
    }
  };

  const handleSaveSession = async () => {
    if (!user) return;
    setSavingSession(true);
    setSessionError("");
    try {
      const watchedDate = draft.watchedDate || null;
      let watchedAt: string | null = null;
      let timezone: string | null = null;
      if (watchedDate && timeValue) {
        const local = new Date(`${watchedDate}T${timeValue}:00`);
        watchedAt = local.toISOString();
        timezone = tzValue || null;
      }
      const input = {
        tmdbId: result.tmdbId,
        mediaType: result.mediaType as MediaType,
        watchedAt,
        watchedDate,
        timezone,
        venue: draft.venue,
        platform: draft.platform,
        companionship: draft.companionship,
        languageMode: draft.languageMode,
        isRewatch: draft.isRewatch,
        rating: sessionRating || null,
      };
      if (editingSessionId) {
        await updateViewingSession(editingSessionId, input);
      } else {
        await addViewingSession(user.id, input);
      }
      const rows = await getViewingSessions(user.id, result.tmdbId, result.mediaType as MediaType);
      setSessions(rows);
      const tags = await getReactionTags().catch(() => []);
      setReactionTags(tags);
      if (!editingSessionId) {
        resetSessionDraft();
      }
    } catch (err) {
      console.error("Failed to save session:", err);
      setSessionError("No se pudo guardar la sesión. Intentá de nuevo.");
    } finally {
      setSavingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    setSavingSession(true);
    setSessionError("");
    try {
      await removeViewingSession(sessionId);
      const rows = await getViewingSessions(user.id, result.tmdbId, result.mediaType as MediaType);
      setSessions(rows);
      if (editingSessionId === sessionId) resetSessionDraft();
    } catch (err) {
      console.error("Failed to delete session:", err);
      setSessionError("No se pudo eliminar la sesión. Intentá de nuevo.");
    } finally {
      setSavingSession(false);
    }
  };

  const displayRating = isReadOnly ? (readOnlyEntry?.rating ?? 0) : rating;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

      <div
        className="relative w-[min(96vw,1200px)] h-full max-h-[92vh] overflow-hidden rounded-[36px] animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "rgba(20,20,32,0.72)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 40px 120px -24px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {/* Liquid glass: blurred cover */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src={posterUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-[60px] saturate-150 opacity-50 animate-breathe-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(12,12,22,0.35) 0%, rgba(12,12,22,0.78) 45%, rgba(12,12,22,0.94) 100%)",
            }}
          />
          <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-2xl" />
        </div>

        {/* Floating close button (mobile, always visible) */}
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="lg:hidden absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-90"
          style={{
            backgroundColor: "rgba(15,15,25,0.65)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "#fff",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10 flex h-full">
          {/* Left: big poster (fixed) */}
          <div className="absolute inset-y-0 left-0 hidden lg:flex flex-col items-center justify-start gap-4 w-[380px] px-6 pt-12 border-r border-white/[0.08]">
            <div className="relative w-full max-w-[320px]">
              <div
                className="absolute -inset-6 rounded-full opacity-40 blur-3xl"
                style={{ background: "color-mix(in srgb, var(--accent) 50%, transparent)" }}
              />
              <img
                src={posterUrl}
                alt={result.title}
                className="relative w-full aspect-[2/3] object-cover rounded-[28px] animate-breathe"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  boxShadow: "0 30px 80px -15px rgba(0,0,0,0.85), 0 10px 30px color-mix(in srgb, var(--accent) 30%, transparent)",
                }}
                loading="lazy"
              />
            </div>
          </div>

          <div className="relative flex-1 min-w-0 flex flex-col lg:pl-[380px] lg:overflow-hidden overflow-y-auto">
          {/* Mobile hero poster (single column) */}
          <div className="lg:hidden relative w-full shrink-0">
            <div
              className="absolute -inset-6 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "color-mix(in srgb, var(--accent) 50%, transparent)" }}
            />
            <div className="relative w-full max-h-[52vh] overflow-hidden">
              <img
                src={posterUrl}
                alt={result.title}
                className="w-full h-full object-cover object-top animate-breathe"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 30px 80px -15px rgba(0,0,0,0.85)",
                }}
                loading="lazy"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(180deg, rgba(12,12,22,0.1) 0%, rgba(12,12,22,0.55) 100%)" }}
              />
            </div>
          </div>

          {/* Header: title + actions */}
          <div className="flex items-start gap-4 p-5 sm:p-6 pb-4">
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
                  {result.title}
                </h2>
                {!isReadOnly ? (
                  <span className="flex gap-1 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(rating === star ? 0 : star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className="w-5 h-5"
                          fill={(hoverRating || rating) >= star ? "var(--accent)" : "none"}
                          stroke={(hoverRating || rating) >= star ? "var(--accent)" : "var(--text-secondary)"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="flex gap-0.5 flex-shrink-0">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-4 h-4"
                        style={{
                          fill: displayRating >= star ? "var(--accent)" : "none",
                          color: displayRating >= star ? "var(--accent)" : "var(--text-secondary)",
                        }}
                      />
                    ))}
                  </span>
                )}
              </div>
              {memberLists.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    En:
                  </span>
                  {memberLists.map((list) => (
                    <span
                      key={list.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                        color: "var(--accent-light)",
                        border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                      }}
                    >
                      <ListIcon className="w-2.5 h-2.5" />
                      {list.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs font-semibold mt-1.5 mb-2" style={{ color: "var(--text-secondary)" }}>
                {(isReadOnly ? details?.year : result.year) || "Sin año"} · {result.mediaType === "movie" ? "Película" : "Serie"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {isReadOnly && readOnlyEntry && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: STATUS_COLORS[readOnlyEntry.status], color: "#000" }}
                  >
                    {STATUS_LABELS[readOnlyEntry.status]}
                  </span>
                )}
                {!isReadOnly && (
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setShowListDropdown((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                      style={{
                        backgroundColor: addedToListId ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
                        color: addedToListId ? "#4ade80" : "var(--text-secondary)",
                        border: `1px solid ${addedToListId ? "rgba(74,222,128,0.45)" : "var(--border)"}`,
                      }}
                    >
                      <ListPlus className="w-3 h-3" />
                      {addedToListId ? "¡Agregado!" : "Agregar a lista"}
                      <ChevronDown
                        className={`w-3 h-3 transition-transform ${showListDropdown ? "rotate-180" : ""}`}
                        style={{ color: "var(--text-secondary)" }}
                      />
                    </button>
                    {showListDropdown && (
                      <div
                        className="absolute z-30 mt-2 left-0 w-64 rounded-xl border overflow-hidden"
                        style={{
                          backgroundColor: "rgba(19,19,31,0.96)",
                          borderColor: "var(--border)",
                          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                          backdropFilter: "blur(16px)",
                          WebkitBackdropFilter: "blur(16px)",
                        }}
                      >
                        <div className="max-h-44 overflow-y-auto">
                          {lists.length === 0 ? (
                            <div className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                              No tenés listas aún. Creá una abajo.
                            </div>
                          ) : (
                            lists.map((list) => {
                              const justAdded = addedToListId === list.id;
                              const isInList = justAdded || listsContaining.has(list.id);
                              return (
                                <button
                                  key={list.id}
                                  onClick={() => handleAddToList(list.id)}
                                  disabled={addingToList === list.id}
                                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-bold transition-colors text-left"
                                  style={{
                                    color: "var(--text-primary)",
                                    backgroundColor: justAdded
                                      ? "rgba(74,222,128,0.1)"
                                      : isInList
                                        ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                                        : "transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!justAdded && !isInList) {
                                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!justAdded && !isInList) {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                  }}
                                >
                                  <span className="truncate">{list.name}</span>
                                  {justAdded ? (
                                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                                  ) : isInList ? (
                                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-light)" }} />
                                  ) : addingToList === list.id ? (
                                    <div
                                      className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                                      style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                                    />
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                        <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
                          <input
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCreateList();
                            }}
                            placeholder="Nombre de la lista nueva..."
                            className="w-full !rounded-lg !text-xs !px-2.5 !py-2"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.05)",
                              border: "1.5px solid var(--border)",
                              color: "var(--text-primary)",
                            }}
                          />
                          <button
                            onClick={handleCreateList}
                            disabled={creatingList || !newListName.trim()}
                            className="mt-1.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50"
                            style={{
                              background: "color-mix(in srgb, var(--accent) 20%, transparent)",
                              color: "var(--accent-light)",
                              border: "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                            }}
                          >
                            <Plus className="w-3 h-3" />
                            {creatingList ? "Creando..." : "Crear lista y agregar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0 items-end">
              <div className="flex items-center gap-2">
                {shareUrl && (
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: copied ? "#4ade80" : "var(--accent-light)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                    }}
                    title={copied ? "¡Link copiado!" : "Copiar link para compartir"}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </button>
                )}
                {!isReadOnly && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving || loading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                      style={{
                        background: "var(--gradient-accent)",
                        color: "#fff",
                        boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)",
                      }}
                    >
                      {saving ? (
                        <div
                          className="w-3 h-3 rounded-full border-2 animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "#fff" }}
                        />
                      ) : (
                        <Pencil className="w-3 h-3" />
                      )}
                      {saving ? "Guardando..." : existingEntry ? "Actualizar" : "Guardar"}
                    </button>
                    {existingEntry && (
                      <button
                        onClick={handleRemove}
                        disabled={saving}
                        title="Eliminar de mis películas"
                        className="w-9 h-9 rounded-full inline-flex items-center justify-center transition-all hover:scale-110 active:scale-90 disabled:opacity-50"
                        style={{
                          ...glass,
                          color: "#f87171",
                          border: "1px solid rgba(248,113,113,0.35)",
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={onClose}
                  className="hidden lg:flex w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "var(--text-primary)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {!isReadOnly && saveError && (
                <p className="max-w-[240px] text-right text-[11px] font-bold leading-snug" style={{ color: "#f87171" }}>
                  {saveError}
                </p>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 lg:flex-1 lg:min-h-0 lg:overflow-y-auto px-5 sm:px-6 pb-6">
            <div className="space-y-5">
              <div className="min-w-0 space-y-5">
          {isReadOnly && readOnlyEntry ? (
                <div className="space-y-5">
                  <div className="rounded-2xl p-5" style={glass}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
                      Descripción
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                      {description || "Sin descripción disponible."}
                    </p>
                  </div>

                  {readOnlyEntry.notes && (
                    <div className="rounded-2xl p-5" style={glass}>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Quote className="w-3.5 h-3.5" style={{ color: "var(--accent-light)" }} />
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                          Comentario
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{readOnlyEntry.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <Link to="/login"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--text-primary)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
                      Iniciar sesión
                    </Link>
                    <Link to="/registro"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                      style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                      Crear cuenta
                    </Link>
                  </div>
                </div>
                ) : (
                <div className="space-y-6">
                {/* Description */}
                <div className="rounded-2xl p-5" style={glass}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Descripción
                    </p>
                    <button
                      onClick={fillDescription}
                      disabled={fetchingDesc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] disabled:opacity-60"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
                        color: "var(--accent-light)",
                        border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      {fetchingDesc ? "Buscando..." : "Obtener automáticamente"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                    {description || "Sin descripción disponible. Tocá “Obtener automáticamente” para cargarla desde TMDB."}
                  </p>
                </div>

                {/* Comment */}
                <div className="rounded-2xl p-5" style={glass}>
                  <div className="flex items-center gap-2 mb-3">
                    <Quote className="w-3.5 h-3.5" style={{ color: "var(--accent-light)" }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Mi comentario
                    </p>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribí un breve comentario personal..."
                    rows={4}
                    className="w-full !rounded-xl !text-sm !p-3 resize-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>

                {/* Estado */}
                <div className="rounded-2xl p-5" style={glass}>
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Estado
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(s.value)}
                        className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                        style={{
                          backgroundColor: status === s.value ? STATUS_COLORS[s.value] : "rgba(255,255,255,0.05)",
                          color: status === s.value ? "#000" : "var(--text-secondary)",
                          border: `1.5px solid ${status === s.value ? STATUS_COLORS[s.value] : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
              </div>

              {/* Registro: cómo lo viste */}
              {!isReadOnly && (
                <div className="min-w-0 space-y-5">
                  <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" style={{ color: "var(--accent-light)" }} />
                        ¿Cómo lo viste?
                        {sessions.length > 0 && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                              color: "var(--accent-light)",
                            }}
                          >
                            {sessions.length}
                          </span>
                        )}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      Contanos dónde y cómo lo viste: ayuda a tu ADN Audiovisual a entender tu forma de consumir.
                    </p>

                    {sessions.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className="rounded-2xl p-3.5"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {session.watched_date && (
                                  <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                                    {session.watched_date}
                                  </span>
                                )}
                                {session.is_rewatch && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{
                                      backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                                      color: "var(--accent-light)",
                                    }}
                                  >
                                    <Repeat className="w-3 h-3" /> Re-ver
                                  </span>
                                )}
                                {session.rating != null && session.rating > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{
                                      backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
                                      color: "var(--accent-light)",
                                    }}
                                  >
                                    <Star className="w-3 h-3" fill="var(--accent)" /> {session.rating}/5
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => startEditSession(session)}
                                  disabled={savingSession}
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                                  style={{ color: "var(--text-secondary)" }}
                                  title="Editar"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSession(session.id)}
                                  disabled={savingSession}
                                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                                  style={{ color: "#f87171" }}
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-2.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {VENUE_LABELS[session.venue]}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Users className="w-3 h-3" /> {COMPANIONSHIP_LABELS[session.companionship]}
                              </span>
                              {session.platform !== "unknown" && (
                                <span className="inline-flex items-center gap-1">
                                  <MonitorPlay className="w-3 h-3" /> {PLATFORM_LABELS[session.platform]}
                                </span>
                              )}
                              {session.language_mode !== "unknown" && (
                                <span className="inline-flex items-center gap-1">
                                  <Languages className="w-3 h-3" /> {LANGUAGE_MODE_LABELS[session.language_mode]}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        {editingSessionId ? "Editar sesión" : "Agregar sesión"}
                      </p>
                      {editingSessionId && (
                        <button
                          onClick={resetSessionDraft}
                          className="text-[11px] font-bold transition-opacity hover:opacity-70"
                          style={{ color: "var(--accent-light)" }}
                        >
                          Cancelar edición
                        </button>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        ¿Cuándo lo viste?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="date"
                          value={draft.watchedDate}
                          onChange={(e) => setDraft((d) => ({ ...d, watchedDate: e.target.value }))}
                          className="flex-1 !rounded-xl !text-sm !px-3 !py-2"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1.5px solid var(--border)",
                            color: "var(--text-primary)",
                          }}
                        />
                        <input
                          type="time"
                          value={timeValue}
                          onChange={(e) => setTimeValue(e.target.value)}
                          className="!w-32 !rounded-xl !text-sm !px-3 !py-2"
                          style={{
                            backgroundColor: "rgba(255,255,255,0.05)",
                            border: "1.5px solid var(--border)",
                            color: "var(--text-primary)",
                          }}
                          placeholder="Hora"
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        La hora es opcional. Si la completás, se guarda la zona horaria ({tzValue || "del navegador"}) para calculá la franja del día correctamente.
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                        Nota de esta vista (opcional)
                      </p>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onMouseEnter={() => setSessionHover(star)}
                            onMouseLeave={() => setSessionHover(0)}
                            onClick={() => setSessionRating(sessionRating === star ? 0 : star)}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className="w-6 h-6"
                              fill={(sessionHover || sessionRating) >= star ? "var(--accent)" : "none"}
                              stroke={(sessionHover || sessionRating) >= star ? "var(--accent)" : "var(--border)"}
                              strokeWidth={1.5}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px]" style={{ color: "var(--text-secondary)" }}>
                        Independiente de la calificación del título.
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        ¿Dónde lo viste?
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {VENUES.map((v) => (
                          <button
                            key={v.value}
                            onClick={() => setDraft((d) => ({ ...d, venue: v.value }))}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: draft.venue === v.value ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)",
                              color: draft.venue === v.value ? "var(--accent-light)" : "var(--text-secondary)",
                              border: `1px solid ${draft.venue === v.value ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                            }}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        ¿Con quién?
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMPANIONSHIP.map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setDraft((d) => ({ ...d, companionship: c.value }))}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: draft.companionship === c.value ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)",
                              color: draft.companionship === c.value ? "var(--accent-light)" : "var(--text-secondary)",
                              border: `1px solid ${draft.companionship === c.value ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                            }}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Idioma
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {LANGUAGE_MODES.map((l) => (
                          <button
                            key={l.value}
                            onClick={() => setDraft((d) => ({ ...d, languageMode: l.value }))}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: draft.languageMode === l.value ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)",
                              color: draft.languageMode === l.value ? "var(--accent-light)" : "var(--text-secondary)",
                              border: `1px solid ${draft.languageMode === l.value ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                            }}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                        Plataforma
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {PLATFORMS.map((p) => (
                          <button
                            key={p.value}
                            onClick={() => setDraft((d) => ({ ...d, platform: p.value }))}
                            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                            style={{
                              backgroundColor: draft.platform === p.value ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)",
                              color: draft.platform === p.value ? "var(--accent-light)" : "var(--text-secondary)",
                              border: `1px solid ${draft.platform === p.value ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setDraft((d) => ({ ...d, isRewatch: !d.isRewatch }))}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all"
                      style={{
                        backgroundColor: draft.isRewatch ? "color-mix(in srgb, var(--accent) 25%, transparent)" : "rgba(255,255,255,0.05)",
                        color: draft.isRewatch ? "var(--accent-light)" : "var(--text-secondary)",
                        border: `1px solid ${draft.isRewatch ? "color-mix(in srgb, var(--accent) 45%, transparent)" : "var(--border)"}`,
                      }}
                    >
                      <Repeat className="w-3 h-3" /> Lo vi más de una vez
                    </button>

                    {editingSessionId && reactionTags.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            ¿Qué te dejó?
                          </p>
                          <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                            {selectedReactions.length}/3 elegidas
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reactionTags.map((tag) => {
                            const selected = selectedReactions.includes(tag.slug);
                            const locked = !selected && selectedReactions.length >= 3;
                            return (
                              <button
                                key={tag.slug}
                                type="button"
                                role="switch"
                                aria-checked={selected}
                                tabIndex={locked ? -1 : 0}
                                onClick={() => toggleReaction(tag)}
                                onKeyDown={(e) => {
                                  if (e.key === " " || e.key === "Enter") {
                                    e.preventDefault();
                                    if (!locked) toggleReaction(tag);
                                  }
                                }}
                                disabled={savingSession || locked}
                                className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all disabled:opacity-40"
                                style={{
                                  backgroundColor: selected
                                    ? "color-mix(in srgb, var(--accent) 25%, transparent)"
                                    : "rgba(255,255,255,0.05)",
                                  color: selected ? "var(--accent-light)" : "var(--text-secondary)",
                                  border: `1px solid ${
                                    selected
                                      ? "color-mix(in srgb, var(--accent) 45%, transparent)"
                                      : "var(--border)"
                                  }`,
                                }}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {sessionError && (
                      <p className="text-xs font-bold" style={{ color: "#f87171" }}>{sessionError}</p>
                    )}

                    <button
                      onClick={handleSaveSession}
                      disabled={savingSession}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.01] disabled:opacity-50"
                      style={{
                        background: "var(--gradient-accent)",
                        color: "#fff",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {savingSession ? "Guardando..." : editingSessionId ? "Guardar cambios" : "Guardar sesión"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>
  );
}
