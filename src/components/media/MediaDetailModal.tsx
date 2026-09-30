import "@/styles/cinema.css";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X, Star, ListPlus, ListIcon, ChevronDown, Check, Sparkles, Quote, Share2, CalendarDays, MapPin, Users, Languages, MonitorPlay, Repeat, Trash2, Pencil, Plus, HelpCircle, RotateCw, Play, Clock } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getPosterUrl, getBackdropUrl, getMediaDetails } from "@/services/tmdb";
import { addToLibrary, updateEntry, removeFromLibrary, getEntry } from "@/services/library";
import { getUserLists, addItemToList, removeItemFromListByTmdb, createList, getListsContainingItem } from "@/services/lists";
import { addViewingSession, getViewingSessions, removeViewingSession, updateViewingSession } from "@/services/viewingSessions";
import { getReactionTags, getSessionReactions, addReaction, removeReaction } from "@/services/reactions";
import { VENUE_PILLS, PLATFORM_PILLS, COMPANIONSHIP_PILLS, LANGUAGE_MODE_PILLS, REWATCH_PILLS, HABIT_GROUPS, HOW_YOU_WATCHED_HELP, VENUE_LABELS, PLATFORM_LABELS, COMPANIONSHIP_LABELS, LANGUAGE_MODE_LABELS, type ViewingPill } from "@/lib/viewingLabels";
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
  want_to_watch: "hsl(265 90% 78%)",
  watching: "hsl(145 70% 65%)",
  completed: "hsl(210 90% 72%)",
  paused: "hsl(48 95% 68%)",
  dropped: "hsl(0 90% 74%)",
};

const emptyDraft = () => ({
  watchedDate: "",
  venue: "unknown" as ViewingVenue,
  platform: "unknown" as ViewingPlatform,
  companionship: "unknown" as ViewingCompanionship,
  languageMode: "unknown" as ViewingLanguageMode,
  isRewatch: false,
});

function toneFromRgb(c: [number, number, number] | null) {
  let hue = 265;
  if (c) {
    const [r, g, b] = c.map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d > 0.06) {
      let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = Math.round(h * 60);
      hue = h < 0 ? h + 360 : h;
    }
  }
  return {
    hue,
    accent: `hsl(${hue} 85% 74%)`,
    glow: `hsl(${hue} 75% 45% / .5)`,
    glow2: `hsl(${(hue + 40) % 360} 75% 40% / .4)`,
  };
}

function PillGroup({
  groupKey,
  pills,
  selected,
  onSelect,
}: {
  groupKey: keyof typeof HABIT_GROUPS;
  pills: ViewingPill[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const meta = HABIT_GROUPS[groupKey];
  const GroupIcon = meta.icon;
  return (
    <div>
      <p className="text-[11px] font-extrabold mb-2 inline-flex items-center gap-1.5 text-white/70">
        <GroupIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />
        {meta.label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((pill) => {
          const PillIcon = pill.icon;
          const isSelected = selected === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => onSelect(pill.value)}
              data-active={isSelected}
              className="frost-tab !py-1.5 !px-3.5 !text-[11px]"
            >
              <PillIcon className="w-3 h-3" style={{ color: isSelected ? "#111" : pill.color }} />
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HelpTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center group align-middle">
      <button
        type="button"
        aria-label="Qué significa este módulo"
        className="liquid-glass-sm w-6 h-6 rounded-full inline-flex items-center justify-center text-white cursor-help"
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <span className="liquid-menu absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-2xl text-[11px] font-semibold leading-relaxed text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none z-30 text-left normal-case tracking-normal">
        {text}
      </span>
    </span>
  );
}

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
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [coverColor, setCoverColor] = useState<[number, number, number] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const justSavedTimer = useRef<number | null>(null);

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
    const img = new Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 6;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        const n = data.length / 4;
        setCoverColor([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      } catch {
        setCoverColor(null);
      }
    };
    img.onerror = () => {
      if (!cancelled) setCoverColor(null);
    };
    img.src = posterUrl;
    return () => {
      cancelled = true;
    };
  }, [posterUrl]);

  useEffect(() => {
    if (!justSavedId) return;
    const el = document.getElementById(`session-${justSavedId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [justSavedId]);

  useEffect(() => {
    return () => {
      if (justSavedTimer.current) window.clearTimeout(justSavedTimer.current);
    };
  }, []);

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

  useEffect(() => {
    if (isReadOnly) return;
    let active = true;
    getMediaDetails(result.mediaType as "movie" | "tv", result.tmdbId)
      .then((d) => { if (active) setDetails(d); })
      .catch(() => {});
    return () => { active = false; };
  }, [isReadOnly, result.mediaType, result.tmdbId]);

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
    const alreadyIn = listsContaining.has(listId);
    setAddingToList(listId);
    try {
      if (alreadyIn) {
        await removeItemFromListByTmdb(listId, result.tmdbId, result.mediaType as MediaType);
        setListsContaining((prev) => {
          const next = new Set(prev);
          next.delete(listId);
          return next;
        });
        setAddedToListId(null);
        setShowListDropdown(false);
      } else {
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
      }
    } catch (err) {
      console.error("Failed to toggle list membership:", err);
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
    if (!user || savingSession) return;
    const isSelected = selectedReactions.includes(tag.slug);
    const willExceed = !isSelected && selectedReactions.length >= 3;
    if (willExceed) {
      setSessionError("Podés elegir hasta 3 reacciones.");
      return;
    }
    if (!editingSessionId) {
      setSelectedReactions((prev) =>
        isSelected ? prev.filter((s) => s !== tag.slug) : [...prev, tag.slug]
      );
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
        const created = await addViewingSession(user.id, input);
        if (selectedReactions.length > 0 && reactionTags.length > 0) {
          for (const slug of selectedReactions) {
            const tag = reactionTags.find((t) => t.slug === slug);
            if (tag) await addReaction(created.id, tag.id);
          }
        }
        setJustSavedId(created.id);
      }
      const rows = await getViewingSessions(user.id, result.tmdbId, result.mediaType as MediaType);
      setSessions(rows);
      const tags = await getReactionTags().catch(() => []);
      setReactionTags(tags);
      if (!editingSessionId) {
        resetSessionDraft();
      }
      setSessionSaved(true);
      if (justSavedTimer.current) window.clearTimeout(justSavedTimer.current);
      justSavedTimer.current = window.setTimeout(() => {
        setSessionSaved(false);
        setJustSavedId(null);
      }, 2200);
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
  const tone = toneFromRgb(coverColor);
  const backdropPath = details?.backdropPath || result.backdropPath;
  const heroImg = backdropPath ? getBackdropUrl(backdropPath, "w1280") : null;
  const genres = details?.genres ?? [];
  const runtimeMin = details?.runtime ?? null;
  const runtimeLabel = runtimeMin ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m` : null;
  const score = details?.tmdbRating ?? result.tmdbRating;
  const cast = details?.cast ?? [];
  const trailerKey = details?.videos?.find((v) => v.site === "YouTube" && v.key)?.key;
  const yearLabel = details?.year ?? result.year ?? "Sin año";
  const chip = "liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold text-white";
  const card = "frost-card rounded-[2rem] p-6";
  const label = "text-xs font-extrabold uppercase tracking-widest text-white/60";
  const roundBtn = "liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-90";
  const whiteBtn = "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50";
  const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 text-white" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

      <div
        className="relative w-[min(96vw,1240px)] h-full max-h-[94vh] overflow-hidden rounded-[2.5rem] animate-pop border border-white/20"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#0b0b14", boxShadow: "0 40px 120px -24px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.2)" }}
      >
        {/* Fondo: backdrop grande + manchas del color del póster */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src={heroImg ?? posterUrl}
            alt=""
            aria-hidden="true"
            className="absolute top-0 inset-x-0 w-full h-[560px] object-cover cinema-kenburns"
            style={heroImg ? undefined : { filter: "blur(40px) saturate(1.3)", transform: "scale(1.4)" }}
          />
          <div className="absolute -top-40 -left-24 w-[620px] h-[620px] rounded-full blur-[130px] cinema-drift-a" style={{ background: tone.glow }} />
          <div className="absolute top-40 -right-24 w-[560px] h-[560px] rounded-full blur-[130px] cinema-drift-b" style={{ background: tone.glow2 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(11,11,20,.25) 0, rgba(11,11,20,.7) 300px, rgba(11,11,20,.94) 520px, #0b0b14 640px)" }} />
        </div>

        {/* Acciones flotantes */}
        <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
          {shareUrl && (
            <button onClick={handleShare} className={roundBtn} title={copied ? "¡Link copiado!" : "Copiar link para compartir"} style={{ color: copied ? "#86efac" : undefined }}>
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            </button>
          )}
          <button onClick={onClose} aria-label="Cerrar" className={roundBtn}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative z-10 h-full overflow-y-auto no-scrollbar">
          <div className="px-6 sm:px-10 pt-24 sm:pt-32 pb-12">
            {/* ───────── HERO ───────── */}
            <section className="flex flex-col md:flex-row gap-8 md:gap-10 items-start md:items-end">
              <img
                src={posterUrl}
                alt={result.title}
                className="w-40 md:w-[250px] shrink-0 aspect-[2/3] object-cover rounded-[2rem] border border-white/25 animate-breathe"
                style={{ boxShadow: `0 30px 80px -15px rgba(0,0,0,.85), 0 10px 40px ${tone.glow}` }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={chip}>{yearLabel}</span>
                  <span className={chip}>{result.mediaType === "movie" ? "Película" : "Serie"}</span>
                  {runtimeLabel && (
                    <span className={`${chip} inline-flex items-center gap-1.5`}><Clock className="w-3.5 h-3.5" /> {runtimeLabel}</span>
                  )}
                  {score ? (
                    <span className="px-4 py-2 rounded-full text-xs font-extrabold text-[#111]" style={{ background: tone.accent }}>TMDB {score.toFixed(1)}</span>
                  ) : null}
                  {isReadOnly && readOnlyEntry && (
                    <span className="inline-flex items-center gap-1.5 pl-3 pr-4 py-2 rounded-full text-xs font-extrabold liquid-glass-sm text-white">
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[readOnlyEntry.status] }} />
                      {STATUS_LABELS[readOnlyEntry.status]}
                    </span>
                  )}
                </div>
                {genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {genres.map((g) => (
                      <span key={g} className="px-3 py-1 rounded-full text-[11px] font-bold border border-white/25 text-white/85">{g}</span>
                    ))}
                  </div>
                )}

                <h2 className="font-cinema mt-5 mb-4 text-5xl md:text-7xl leading-[1.02] drop-shadow-[0_10px_50px_rgba(0,0,0,.5)]">{result.title}</h2>

                <p className="text-base md:text-lg leading-relaxed font-medium text-white/85 max-w-2xl text-pretty line-clamp-5">
                  {description || result.overview || "Sin sinopsis disponible."}
                </p>

                {/* Nota + acciones */}
                <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <p className={`${label} mb-2`}>{isReadOnly ? "Su nota" : "Tu nota"}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const on = (isReadOnly ? displayRating : hoverRating || rating) >= star;
                        const icon = <Star className="w-7 h-7" fill={on ? tone.accent : "none"} stroke={on ? tone.accent : "rgba(255,255,255,.5)"} strokeWidth={1.6} />;
                        return isReadOnly ? (
                          <span key={star}>{icon}</span>
                        ) : (
                          <button key={star} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(rating === star ? 0 : star)} className="transition-transform hover:scale-125">
                            {icon}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button onClick={handleSave} disabled={saving || loading} className={whiteBtn}>
                        {saving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
                        {saving ? "Guardando..." : existingEntry ? "Actualizar" : "Guardar en mi biblioteca"}
                      </button>

                      <div ref={dropdownRef} className="relative">
                        <button onClick={() => setShowListDropdown((v) => !v)} className={glassBtn} style={addedToListId ? { color: "#86efac" } : undefined}>
                          <ListPlus className="w-4 h-4" />
                          {addedToListId ? "¡Agregado!" : "Agregar a lista"}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showListDropdown ? "rotate-180" : ""}`} />
                        </button>
                        {showListDropdown && (
                          <div className="liquid-menu absolute z-40 mt-3 left-0 w-72 rounded-[1.75rem] overflow-hidden animate-slide-up">
                            <div className="max-h-52 overflow-y-auto p-2">
                              {lists.length === 0 ? (
                                <div className="px-3 py-3 text-xs text-white/70">No tenés listas aún. Creá una abajo.</div>
                              ) : (
                                lists.map((list) => {
                                  const justAdded = addedToListId === list.id;
                                  const isInList = justAdded || listsContaining.has(list.id);
                                  return (
                                    <button key={list.id} onClick={() => handleAddToList(list.id)} disabled={addingToList === list.id}
                                      className="liquid-menu-item justify-between">
                                      <span className="truncate">{list.name}</span>
                                      {isInList ? (
                                        <Check className="w-4 h-4 shrink-0" style={{ color: justAdded ? "#86efac" : tone.accent }} />
                                      ) : addingToList === list.id ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                                      ) : null}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                            <div className="p-3 border-t border-white/10 space-y-2">
                              <input value={newListName} onChange={(e) => setNewListName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }}
                                placeholder="Nombre de la lista nueva..." className="glass-input !h-11 !text-xs" />
                              <button onClick={handleCreateList} disabled={creatingList || !newListName.trim()}
                                className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-white text-[#111] text-xs font-extrabold disabled:opacity-50">
                                <Plus className="w-3.5 h-3.5" />
                                {creatingList ? "Creando..." : "Crear lista y agregar"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {trailerKey && (
                        <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noreferrer" className={`${glassBtn} hover:text-white`}>
                          <Play className="w-4 h-4" fill="currentColor" /> Tráiler
                        </a>
                      )}

                      {existingEntry && (
                        <button onClick={handleRemove} disabled={saving} title="Eliminar de mi biblioteca" className={roundBtn} style={{ color: "#fca5a5" }}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!isReadOnly && saveError && <p className="mt-3 text-xs font-bold text-red-300">{saveError}</p>}

                {memberLists.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mt-5">
                    <span className={label}>En:</span>
                    {memberLists.map((list) => (
                      <span key={list.id} className="liquid-glass-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold text-white">
                        <ListIcon className="w-3 h-3" /> {list.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ───────── CUERPO ───────── */}
            <div className={`mt-10 grid gap-5 ${isReadOnly ? "max-w-3xl" : "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"}`}>
              <div className="min-w-0 space-y-5">
                {isReadOnly && readOnlyEntry ? (
                  <>
                    <div className={card}>
                      <p className={`${label} mb-3`}>Descripción</p>
                      <p className="text-sm leading-relaxed text-white/90">{description || "Sin descripción disponible."}</p>
                    </div>
                    {readOnlyEntry.notes && (
                      <div className={card}>
                        <div className="flex items-center gap-2 mb-3">
                          <Quote className="w-4 h-4" style={{ color: tone.accent }} />
                          <p className={label}>Comentario</p>
                        </div>
                        <p className="text-sm leading-relaxed text-white/90">{readOnlyEntry.notes}</p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/login" className={`${glassBtn} flex-1 hover:text-white`}>Iniciar sesión</Link>
                      <Link to="/registro" className={`${whiteBtn} flex-1 hover:text-[#111]`}>Crear cuenta</Link>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Estado */}
                    <div className={card}>
                      <p className={`${label} mb-4`}>Estado</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUSES.map((s) => (
                          <button key={s.value} onClick={() => setStatus(s.value)} data-active={status === s.value} className="frost-tab !py-2 !px-4 !text-xs">
                            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.value] }} />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comentario */}
                    <div className={card}>
                      <div className="flex items-center gap-2 mb-4">
                        <Quote className="w-4 h-4" style={{ color: tone.accent }} />
                        <p className={label}>Mi comentario</p>
                      </div>
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                        placeholder="Escribí un breve comentario personal..." rows={4} className="glass-input" />
                    </div>

                    {/* Descripción */}
                    <div className={card}>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <p className={label}>Descripción</p>
                        <button onClick={fillDescription} disabled={fetchingDesc} className="liquid-glass-sm inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[11px] font-extrabold text-white disabled:opacity-60">
                          <Sparkles className="w-3.5 h-3.5" />
                          {fetchingDesc ? "Buscando..." : "Obtener automáticamente"}
                        </button>
                      </div>
                      <p className="text-sm leading-relaxed text-white/85">
                        {description || "Sin descripción disponible. Tocá “Obtener automáticamente” para cargarla desde TMDB."}
                      </p>
                    </div>
                  </>
                )}

                {cast.length > 0 && (
                  <div className={card}>
                    <p className={`${label} mb-4`}>Reparto</p>
                    <div className="flex flex-wrap gap-2">
                      {cast.map((c) => (
                        <span key={c.name} className="liquid-glass-sm px-3.5 py-1.5 rounded-full text-xs font-bold text-white">{c.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Registro: cómo lo viste */}
              {!isReadOnly && (
                <div className="min-w-0">
                  <div className="liquid-glass rounded-[2rem] p-6 md:p-7 space-y-5">
                    <div className="flex items-center gap-2.5 text-base font-extrabold">
                      <CalendarDays className="w-5 h-5" style={{ color: tone.accent }} />
                      ¿Cómo lo viste?
                      {sessions.length > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold text-[#111]" style={{ background: tone.accent }}>{sessions.length}</span>
                      )}
                      <HelpTooltip text={HOW_YOU_WATCHED_HELP} />
                    </div>
                    <p className="text-xs leading-relaxed text-white/70">
                      Contanos dónde y cómo lo viste: ayuda a tu ADN Audiovisual a entender tu forma de consumir.
                    </p>

                    {sessions.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sessions.map((session) => {
                          const isJustSaved = session.id === justSavedId;
                          const coverUrl = heroImg ?? getBackdropUrl(result.backdropPath, "w780");
                          return (
                            <div key={session.id} id={`session-${session.id}`}
                              className={`frost-card relative rounded-[1.5rem] overflow-hidden ${isJustSaved ? "animate-saved-flash" : ""}`}>
                              <div className="relative h-28 overflow-hidden">
                                <div className="absolute -inset-3 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${coverUrl})`, filter: "blur(10px) saturate(150%)" }} />
                                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${tone.glow}, rgba(8,8,14,.85))` }} />
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[80%]">
                                  <span className="liquid-glass-sm inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white">
                                    <CalendarDays className="w-3 h-3" /> {session.watched_date ?? "Fecha sin registrar"}
                                  </span>
                                  {session.is_rewatch && (
                                    <span className="liquid-glass-sm inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white">
                                      <Repeat className="w-3 h-3" /> Re-ver
                                    </span>
                                  )}
                                </div>
                                <span className="liquid-glass-sm absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold text-white">
                                  <Star className="w-3.5 h-3.5" fill={session.rating ? tone.accent : "none"} stroke={session.rating ? tone.accent : "currentColor"} />
                                  {session.rating ? `${session.rating}/5` : "Sin nota"}
                                </span>
                              </div>
                              <div className="p-4">
                                <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap text-[11px] font-bold text-white/80">
                                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" style={{ color: HABIT_GROUPS.venue.color }} /> {VENUE_LABELS[session.venue]}</span>
                                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" style={{ color: HABIT_GROUPS.companionship.color }} /> {COMPANIONSHIP_LABELS[session.companionship]}</span>
                                  {session.platform !== "unknown" && (
                                    <span className="inline-flex items-center gap-1"><MonitorPlay className="w-3 h-3" style={{ color: HABIT_GROUPS.platform.color }} /> {PLATFORM_LABELS[session.platform]}</span>
                                  )}
                                  {session.language_mode !== "unknown" && (
                                    <span className="inline-flex items-center gap-1"><Languages className="w-3 h-3" style={{ color: HABIT_GROUPS.language.color }} /> {LANGUAGE_MODE_LABELS[session.language_mode]}</span>
                                  )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-3 border-t border-white/10 pt-2.5">
                                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">{isJustSaved ? "Recién guardada" : "Vista registrada"}</span>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => startEditSession(session)} disabled={savingSession} title="Editar"
                                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-50"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => handleDeleteSession(session.id)} disabled={savingSession} title="Eliminar"
                                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 disabled:opacity-50" style={{ color: "#fca5a5" }}><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between gap-2">
                      <p className={label}>{editingSessionId ? "Editar sesión" : "Agregar sesión"}</p>
                      {editingSessionId && (
                        <button onClick={resetSessionDraft} className="text-[11px] font-extrabold hover:opacity-70" style={{ color: tone.accent }}>Cancelar edición</button>
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-bold mb-2 text-white/70">¿Cuándo lo viste?</p>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input type="date" value={draft.watchedDate} onChange={(e) => setDraft((d) => ({ ...d, watchedDate: e.target.value }))} className="glass-input flex-1 !h-12 !text-sm" />
                        <input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} className="glass-input sm:!w-36 !h-12 !text-sm" placeholder="Hora" />
                      </div>
                      <p className="mt-2 text-[10px] leading-relaxed text-white/55">
                        La hora es opcional. Si la completás, se guarda la zona horaria ({tzValue || "del navegador"}) para calcular la franja del día correctamente.
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-extrabold mb-2.5 uppercase tracking-wider text-white/70">Nota de esta vista (opcional)</p>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const on = (sessionHover || sessionRating) >= star;
                          return (
                            <button key={star} onMouseEnter={() => setSessionHover(star)} onMouseLeave={() => setSessionHover(0)}
                              onClick={() => setSessionRating(sessionRating === star ? 0 : star)} className="transition-transform hover:scale-125">
                              <Star className="w-6 h-6" fill={on ? tone.accent : "none"} stroke={on ? tone.accent : "rgba(255,255,255,.45)"} strokeWidth={1.6} />
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/55">Independiente de la calificación del título.</p>
                    </div>

                    <PillGroup groupKey="venue" pills={VENUE_PILLS} selected={draft.venue} onSelect={(value) => setDraft((d) => ({ ...d, venue: value as ViewingVenue }))} />
                    <PillGroup groupKey="companionship" pills={COMPANIONSHIP_PILLS} selected={draft.companionship} onSelect={(value) => setDraft((d) => ({ ...d, companionship: value as ViewingCompanionship }))} />
                    <PillGroup groupKey="language" pills={LANGUAGE_MODE_PILLS} selected={draft.languageMode} onSelect={(value) => setDraft((d) => ({ ...d, languageMode: value as ViewingLanguageMode }))} />
                    <PillGroup groupKey="platform" pills={PLATFORM_PILLS} selected={draft.platform} onSelect={(value) => setDraft((d) => ({ ...d, platform: value as ViewingPlatform }))} />
                    <PillGroup groupKey="rewatch" pills={REWATCH_PILLS} selected={draft.isRewatch ? "rewatch" : "first"} onSelect={(value) => setDraft((d) => ({ ...d, isRewatch: value === "rewatch" }))} />

                    {reactionTags.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/70">¿Qué te dejó?</p>
                          <span className="text-[10px] text-white/55">{selectedReactions.length}/3 elegidas</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reactionTags.map((tag) => {
                            const selected = selectedReactions.includes(tag.slug);
                            const locked = !selected && selectedReactions.length >= 3;
                            return (
                              <button key={tag.slug} type="button" role="switch" aria-checked={selected} tabIndex={locked ? -1 : 0}
                                onClick={() => toggleReaction(tag)}
                                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!locked) toggleReaction(tag); } }}
                                disabled={savingSession || locked} data-active={selected}
                                className="frost-tab !py-1.5 !px-3.5 !text-[11px] disabled:opacity-40">
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {sessionError && <p className="text-xs font-bold text-red-300">{sessionError}</p>}

                    <button onClick={handleSaveSession} disabled={savingSession}
                      className={`w-full inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm font-extrabold transition-transform hover:scale-[1.01] disabled:opacity-50 ${sessionSaved ? "animate-pop" : ""}`}
                      style={sessionSaved ? { backgroundColor: "#4ade80", color: "#052e16", boxShadow: "0 8px 28px rgba(74,222,128,.45)" } : { background: "#fff", color: "#111" }}>
                      {sessionSaved ? (
                        <><Check className="w-4 h-4" strokeWidth={3} />{editingSessionId ? "Cambios guardados" : "Sesión guardada"}</>
                      ) : savingSession ? (
                        <><RotateCw className="w-4 h-4 animate-spin" />Guardando...</>
                      ) : (
                        <><Plus className="w-4 h-4" />{editingSessionId ? "Guardar cambios" : "Guardar sesión"}</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
