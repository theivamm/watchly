import "@/styles/cinema.css";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { X, Star, ListPlus, ListIcon, ChevronDown, Check, Sparkles, Quote, Share2, CalendarDays, MapPin, Users, Languages, MonitorPlay, Repeat, Trash2, Pencil, Plus, HelpCircle, RotateCw, Play, Clock, Bookmark, CheckCheck, Pause, XCircle, Info } from "lucide-react";
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
  accent,
}: {
  groupKey: keyof typeof HABIT_GROUPS;
  pills: ViewingPill[];
  selected: string;
  onSelect: (value: string) => void;
  accent: string;
}) {
  const meta = HABIT_GROUPS[groupKey];
  const GroupIcon = meta.icon;
  return (
    <div>
      <p className="text-sm font-extrabold mb-3 inline-flex items-center gap-2">
        <GroupIcon className="w-4 h-4" style={{ color: meta.color }} />
        {meta.label}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-4 gap-2.5">
        {pills.map((pill) => {
          const PillIcon = pill.icon;
          const isSelected = selected === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => onSelect(pill.value)}
              className="flex items-center gap-3 px-4 min-h-[56px] rounded-2xl text-sm font-bold text-left border transition-all hover:scale-[1.02] active:scale-95"
              style={isSelected ? { background: accent, color: "#111", borderColor: "transparent" } : { background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.2)" }}
            >
              <PillIcon className="w-5 h-5 shrink-0" style={{ color: isSelected ? "#111" : pill.color }} />
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
  const [savedTick, setSavedTick] = useState(0);
  const [tapped, setTapped] = useState<{ key: string; n: number } | null>(null);
  const entryRef = useRef<Entry | null>(null);
  const dirtyRef = useRef(false);
  const notesTouched = useRef(false);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
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
  const [tab, setTab] = useState<"info" | "diary">("info");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
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

  useEffect(() => { entryRef.current = existingEntry; }, [existingEntry]);

  // Encola los guardados para que clics rápidos no creen la entrada dos veces.
  const persist = (values: { status: EntryStatus; rating: number; notes: string }) => {
    if (!user || readOnlyEntry) return;
    setSaving(true);
    setSaveError("");
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const cur = entryRef.current;
        const entry = cur
          ? await updateEntry(cur.id, {
              status: values.status,
              rating: values.rating || null,
              notes: values.notes || undefined,
              description: description || undefined,
            })
          : await addToLibrary(user.id, {
              tmdbId: result.tmdbId,
              mediaType: result.mediaType as MediaType,
              title: result.title,
              posterPath: result.posterPath,
              status: values.status,
              rating: values.rating || null,
              notes: values.notes || undefined,
              description: description || undefined,
            });
        entryRef.current = entry;
        setExistingEntry(entry);
        dirtyRef.current = true;
        setSavedTick((t) => t + 1);
      } catch (err) {
        console.error("Failed to save entry:", err);
        setSaveError("No se pudo guardar. Revisá tu conexión e intentá de nuevo.");
      } finally {
        setSaving(false);
      }
    });
  };

  const pickStatus = (s: EntryStatus) => {
    setStatus(s);
    setTapped({ key: s, n: Date.now() });
    persist({ status: s, rating, notes });
  };

  const pickRating = (star: number) => {
    const next = rating === star ? 0 : star;
    setRating(next);
    setTapped({ key: `star-${star}`, n: Date.now() });
    persist({ status, rating: next, notes });
  };

  useEffect(() => {
    if (!notesTouched.current) return;
    const t = setTimeout(() => persist({ status, rating, notes }), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  const close = () => {
    if (dirtyRef.current && entryRef.current) onSaved?.(entryRef.current);
    onClose();
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
  const STATUS_ICONS: Record<EntryStatus, typeof Bookmark> = { want_to_watch: Bookmark, watching: Play, completed: CheckCheck, paused: Pause, dropped: XCircle };
  const hueA = (tone.hue + 330) % 360;
  const hueB = (tone.hue + 40) % 360;
  const fringeEdges = `inset 3px 0 0 hsl(${hueA} 90% 62% / .55), inset -3px 0 0 hsl(${hueB} 90% 62% / .55)`;
  const accentGrad = `linear-gradient(135deg, ${tone.accent}, hsl(${hueB} 85% 70%))`;
  const chip = "liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold text-white";
  const label = "text-xs font-extrabold uppercase tracking-widest text-white/65";
  const roundBtn = "liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-90";
  const whiteBtn = "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50";
  const glassBtn = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03]";
  const showDiary = !isReadOnly && tab === "diary";
  const dates = sessions.map((s) => s.watched_date).filter(Boolean).sort() as string[];
  const rewatchCount = sessions.filter((s) => s.is_rewatch).length;
  const rated = sessions.filter((s) => s.rating);
  const avgSession = rated.length ? rated.reduce((a, s) => a + (s.rating ?? 0), 0) / rated.length : null;
  const Head = ({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) => (
    <div className="flex items-end justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h3 className="font-cinema text-3xl md:text-4xl leading-none">{title}</h3>
        {hint && <p className="text-xs font-bold text-white/65 mt-2">{hint}</p>}
      </div>
      {right}
    </div>
  );
  const Stars = ({ value, hover, size, onPick, onHover, readOnly }: { value: number; hover: number; size: number; onPick?: (n: number) => void; onHover?: (n: number) => void; readOnly?: boolean }) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const on = (hover || value) >= star;
        const icon = <Star style={{ width: size, height: size }} fill={on ? tone.accent : "none"} stroke={on ? tone.accent : "rgba(255,255,255,.5)"} strokeWidth={1.6} />;
        return readOnly ? <span key={star}>{icon}</span> : (
          <button key={star} type="button" onMouseEnter={() => onHover?.(star)} onMouseLeave={() => onHover?.(0)} onClick={() => onPick?.(star)} disabled={loading}
            className={`transition-transform hover:scale-125 ${tapped?.key.startsWith("star-") && value >= star ? "animate-star-pop" : ""}`} style={{ animationDelay: `${star * 40}ms` }}>{icon}</button>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-1.5 sm:p-3 text-white" onClick={close}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />

      <div
        className="relative w-[min(99vw,1600px)] h-full max-h-[97vh] overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] animate-pop border border-white/20"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: "#0b0b14", boxShadow: `0 40px 120px -24px rgba(0,0,0,.9), 0 0 100px -20px ${tone.glow}, ${fringeEdges}, inset 0 1px 0 rgba(255,255,255,.25)` }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img src={posterUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "blur(80px) saturate(1.7)", transform: "scale(1.5)", opacity: 0.75 }} />
          <div className="absolute -top-40 -left-32 w-[640px] h-[640px] rounded-full blur-[120px] cinema-drift-a" style={{ background: tone.glow }} />
          <div className="absolute -bottom-48 right-0 w-[720px] h-[720px] rounded-full blur-[130px] cinema-drift-b" style={{ background: tone.glow2 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,8,16,.3), rgba(8,8,16,.72))" }} />
        </div>

        <button onClick={close} aria-label="Cerrar" className={`${roundBtn} absolute top-4 right-4 z-30`}><X className="w-5 h-5" /></button>

        <div className="relative z-10 h-full overflow-y-auto no-scrollbar">
          {/* ───────── BANNER con aberración cromática ───────── */}
          <div className="relative h-[300px] md:h-[400px]" style={{ WebkitMaskImage: "linear-gradient(180deg,#000 55%,transparent 100%)", maskImage: "linear-gradient(180deg,#000 55%,transparent 100%)" }} aria-hidden="true">
            <div className="absolute inset-0 overflow-hidden cinema-kenburns">
              <img src={heroImg ?? posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" style={{ transform: "translateX(-8px)", filter: "sepia(1) saturate(6) hue-rotate(-50deg)", mixBlendMode: "screen" }} />
              <img src={heroImg ?? posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" style={{ transform: "translateX(8px)", filter: "sepia(1) saturate(6) hue-rotate(150deg)", mixBlendMode: "screen" }} />
              <img src={heroImg ?? posterUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={heroImg ? undefined : { filter: "blur(24px)", transform: "scale(1.3)" }} />
            </div>
            <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, rgba(8,8,16,.85) 0%, rgba(8,8,16,.25) 55%, transparent 100%), linear-gradient(135deg, ${tone.glow}, transparent 55%)` }} />
          </div>

          <div className="relative px-4 sm:px-8 pb-8 -mt-[210px] md:-mt-[300px] grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)]">
            {/* ───────── RIEL IZQUIERDO: póster + controles ───────── */}
            <aside className="space-y-5 lg:pt-14">
              <div className="relative mx-auto max-w-[240px] lg:max-w-none" style={{ perspective: 900 }}
                onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -12, y: ((e.clientX - r.left) / r.width - 0.5) * 14 }); }}
                onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
                <div className="relative transition-transform duration-200 ease-out" style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
                  <img src={posterUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[2rem] opacity-70" style={{ transform: "translateX(-9px)", filter: "sepia(1) saturate(6) hue-rotate(-50deg)", mixBlendMode: "screen" }} />
                  <img src={posterUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover rounded-[2rem] opacity-70" style={{ transform: "translateX(9px)", filter: "sepia(1) saturate(6) hue-rotate(150deg)", mixBlendMode: "screen" }} />
                  <img src={posterUrl} alt={result.title} className="relative w-full aspect-[2/3] object-cover rounded-[2rem] border border-white/30" style={{ boxShadow: `0 30px 70px -15px rgba(0,0,0,.85), 0 10px 50px ${tone.glow}` }} />
                  <div className="absolute inset-0 rounded-[2rem] pointer-events-none" style={{ background: `linear-gradient(${115 + tilt.y * 4}deg, rgba(255,255,255,.22), transparent 40%)` }} />
                </div>
              </div>

              {isReadOnly && readOnlyEntry ? (
                <div className="liquid-glass rounded-[1.75rem] p-4 flex items-center gap-3">
                  {(() => { const I = STATUS_ICONS[readOnlyEntry.status]; return <I className="w-5 h-5" style={{ color: STATUS_COLORS[readOnlyEntry.status] }} />; })()}
                  <div><p className={label}>Estado</p><p className="text-sm font-extrabold mt-0.5">{STATUS_LABELS[readOnlyEntry.status]}</p></div>
                </div>
              ) : (
                <div className="liquid-glass rounded-[1.75rem] p-2 space-y-1">
                  {STATUSES.map((s) => {
                    const I = STATUS_ICONS[s.value];
                    const active = status === s.value;
                    return (
                      <button key={tapped?.key === s.value ? `${s.value}-${tapped.n}` : s.value} onClick={() => pickStatus(s.value)} disabled={loading}
                        className={`w-full flex items-center gap-3 px-4 h-12 rounded-full text-sm font-extrabold transition-colors duration-300 active:scale-95 ${tapped?.key === s.value ? "animate-status-tap" : ""}`}
                        style={{ background: active ? accentGrad : "transparent", color: active ? "#111" : "rgba(255,255,255,.9)" }}>
                        <I className="w-4 h-4" style={{ color: active ? "#111" : STATUS_COLORS[s.value] }} />
                        {s.label}
                        {active && (saving && tapped?.key === s.value ? <RotateCw className="w-4 h-4 ml-auto animate-spin" /> : <Check className="w-4 h-4 ml-auto animate-check-in" strokeWidth={3} />)}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="liquid-glass rounded-[1.75rem] px-5 py-4">
                <p className={`${label} mb-3`}>{isReadOnly ? "Su nota" : "Tu nota"}</p>
                <Stars value={isReadOnly ? displayRating : rating} hover={isReadOnly ? 0 : hoverRating} size={30} onPick={pickRating} onHover={setHoverRating} readOnly={isReadOnly} />
              </div>

              {!isReadOnly && (
                <div className="space-y-3">
                  <div className="min-h-6 flex items-center justify-center text-xs font-extrabold text-center">
                    {saveError ? <span className="text-red-300">{saveError}</span>
                      : saving ? <span className="inline-flex items-center gap-1.5 text-white/70"><RotateCw className="w-3.5 h-3.5 animate-spin" /> Guardando…</span>
                      : savedTick > 0 ? <span key={savedTick} className="inline-flex items-center gap-1.5 text-emerald-300 animate-pop"><Check className="w-3.5 h-3.5" strokeWidth={3} /> Guardado automáticamente</span>
                      : <span className="text-white/60">{existingEntry ? "Los cambios se guardan solos" : "Elegí un estado para guardarla"}</span>}
                  </div>

                  <div ref={dropdownRef} className="relative">
                    <button onClick={() => setShowListDropdown((v) => !v)} className={`${glassBtn} w-full`} style={addedToListId ? { color: "#86efac" } : undefined}>
                      <ListPlus className="w-4 h-4" />
                      {addedToListId ? "¡Agregado!" : "Agregar a lista"}
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showListDropdown ? "rotate-180" : ""}`} />
                    </button>
                    {showListDropdown && (
                      <div className="liquid-menu absolute z-40 mt-2 left-0 right-0 rounded-[1.75rem] overflow-hidden animate-slide-up">
                        <div className="max-h-52 overflow-y-auto p-2">
                          {lists.length === 0 ? <div className="px-3 py-3 text-xs text-white/70">No tenés listas aún. Creá una abajo.</div> : lists.map((list) => {
                            const justAdded = addedToListId === list.id;
                            const isInList = justAdded || listsContaining.has(list.id);
                            return (
                              <button key={list.id} onClick={() => handleAddToList(list.id)} disabled={addingToList === list.id} className="liquid-menu-item justify-between">
                                <span className="truncate">{list.name}</span>
                                {isInList ? <Check className="w-4 h-4 shrink-0" style={{ color: justAdded ? "#86efac" : tone.accent }} />
                                  : addingToList === list.id ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" /> : null}
                              </button>
                            );
                          })}
                        </div>
                        <div className="p-3 border-t border-white/10 space-y-2">
                          <input value={newListName} onChange={(e) => setNewListName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); }} placeholder="Nombre de la lista nueva..." className="glass-input !h-11 !text-xs" />
                          <button onClick={handleCreateList} disabled={creatingList || !newListName.trim()} className="w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-full bg-white text-[#111] text-xs font-extrabold disabled:opacity-50">
                            <Plus className="w-3.5 h-3.5" /> {creatingList ? "Creando..." : "Crear lista y agregar"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2.5">
                    {trailerKey && <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noreferrer" className={`${glassBtn} flex-1 hover:text-white`}><Play className="w-4 h-4" fill="currentColor" /> Tráiler</a>}
                    {shareUrl && <button onClick={handleShare} className={`${glassBtn} flex-1`} style={{ color: copied ? "#86efac" : undefined }}>{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} {copied ? "Copiado" : "Compartir"}</button>}
                    {existingEntry && <button onClick={handleRemove} disabled={saving} title="Eliminar de mi biblioteca" className={roundBtn} style={{ color: "#fca5a5" }}><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              )}

              {isReadOnly && (
                <div className="flex gap-2.5">
                  {trailerKey && <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noreferrer" className={`${glassBtn} flex-1 hover:text-white`}><Play className="w-4 h-4" fill="currentColor" /> Tráiler</a>}
                  {shareUrl && <button onClick={handleShare} className={`${glassBtn} flex-1`} style={{ color: copied ? "#86efac" : undefined }}>{copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} {copied ? "Copiado" : "Compartir"}</button>}
                </div>
              )}
            </aside>

            {/* ───────── COLUMNA PRINCIPAL ───────── */}
            <main className="min-w-0">
              <div className="min-h-[200px] md:min-h-[290px] flex flex-col justify-end pr-14 mb-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={chip}>{yearLabel}</span>
                  <span className={chip}>{result.mediaType === "movie" ? "Película" : "Serie"}</span>
                  {runtimeLabel && <span className={`${chip} inline-flex items-center gap-1.5`}><Clock className="w-3.5 h-3.5" /> {runtimeLabel}</span>}
                  {genres.map((g) => <span key={g} className="liquid-glass-sm px-3.5 py-2 rounded-full text-xs font-bold text-white">{g}</span>)}
                </div>
                <div className="flex items-end justify-between gap-6">
                  <h2 className="font-cinema text-5xl md:text-7xl xl:text-8xl leading-[0.98] drop-shadow-[0_10px_50px_rgba(0,0,0,.6)] min-w-0 break-words">{result.title}</h2>
                  {score ? (
                    <div className="relative shrink-0 w-[96px] h-[96px] hidden sm:block">
                      <svg width="96" height="96" className="-rotate-90" aria-hidden="true">
                        <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="8" />
                        <circle cx="48" cy="48" r="42" fill="none" stroke={tone.accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={263.9} strokeDashoffset={263.9 * (1 - Math.min(score, 10) / 10)}
                          style={{ filter: "drop-shadow(-2px 0 0 rgba(255,60,120,.8)) drop-shadow(2px 0 0 rgba(60,200,255,.8))" }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-cinema text-3xl leading-none">{score.toFixed(1)}</span><span className="text-[9px] font-extrabold tracking-widest text-white/70">TMDB</span></div>
                    </div>
                  ) : null}
                </div>
              </div>

              {!isReadOnly && (
                <div className="liquid-glass rounded-full p-1.5 flex gap-1.5 w-full sm:w-fit mb-8">
                  {([{ k: "info", t: "Sobre el título", I: Info }, { k: "diary", t: "Mi diario", I: Pencil }] as const).map(({ k, t, I }) => (
                    <button key={k} onClick={() => setTab(k)} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full text-sm font-extrabold transition-all"
                      style={{ background: tab === k ? accentGrad : "transparent", color: tab === k ? "#111" : "rgba(255,255,255,.85)" }}>
                      <I className="w-4 h-4" /> {t}
                      {k === "diary" && sessions.length > 0 && <span className="px-2 py-0.5 rounded-full text-[11px] bg-black/25" style={{ color: tab === k ? "#111" : "#fff" }}>{sessions.length}</span>}
                    </button>
                  ))}
                </div>
              )}

              {!showDiary && (
                <div className="space-y-10">
                  <section>
                    <Head title="Sinopsis" right={!isReadOnly ? (
                      <button onClick={fillDescription} disabled={fetchingDesc} className="liquid-glass-sm inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[11px] font-extrabold text-white disabled:opacity-60">
                        <Sparkles className="w-3.5 h-3.5" /> {fetchingDesc ? "Buscando..." : "Actualizar desde TMDB"}
                      </button>) : undefined} />
                    <p className="text-lg md:text-xl leading-relaxed text-white/90 text-pretty max-w-4xl">{description || result.overview || "Sin sinopsis disponible."}</p>
                  </section>

                  {cast.length > 0 && (
                    <section className="border-t border-white/20 pt-6">
                      <Head title="Reparto" />
                      <div className="flex flex-wrap gap-x-6 gap-y-3 items-baseline">
                        {cast.map((c, i) => <span key={c.name} className="font-cinema leading-none text-white" style={{ fontSize: `${i < 3 ? 2.1 : 1.45}rem`, opacity: 1 - i * 0.05 }}>{c.name}</span>)}
                      </div>
                    </section>
                  )}

                  {memberLists.length > 0 && (
                    <section className="border-t border-white/20 pt-6">
                      <Head title="Está en tus listas" />
                      <div className="flex flex-wrap gap-2.5">
                        {memberLists.map((list) => <span key={list.id} className="liquid-glass-sm inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-extrabold text-white"><ListIcon className="w-4 h-4" /> {list.name}</span>)}
                      </div>
                    </section>
                  )}

                  {isReadOnly && readOnlyEntry && (
                    <>
                      {readOnlyEntry.notes && (
                        <section className="border-t border-white/20 pt-6">
                          <Head title="Comentario" right={<Quote className="w-6 h-6 text-white/55" />} />
                          <p className="text-lg leading-relaxed text-white/90 max-w-3xl">{readOnlyEntry.notes}</p>
                        </section>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link to="/login" className={`${glassBtn} flex-1 hover:text-white`}>Iniciar sesión</Link>
                        <Link to="/registro" className={`${whiteBtn} flex-1 hover:text-[#111]`}>Crear cuenta</Link>
                      </div>
                    </>
                  )}
                </div>
              )}

              {showDiary && (
                <div className="space-y-12">
                  <div className="liquid-glass rounded-[2rem] grid grid-cols-2 md:grid-cols-4 [&>div]:px-6 [&>div]:py-5 [&>div+div]:md:border-l [&>div+div]:border-white/15">
                    {[
                      { v: String(sessions.length), l: sessions.length === 1 ? "vista" : "vistas" },
                      { v: String(rewatchCount), l: "re-vistas" },
                      { v: avgSession != null ? avgSession.toFixed(1) : "—", l: "nota media" },
                      { v: dates.length ? dates[dates.length - 1] : "—", l: "última vez" },
                    ].map(({ v, l }) => (
                      <div key={l} className="min-w-0"><p className="font-cinema text-4xl md:text-5xl leading-none truncate">{v}</p><p className="text-xs font-extrabold uppercase tracking-widest mt-2 text-white/65">{l}</p></div>
                    ))}
                  </div>

                  <section>
                    <Head title="Mi comentario" hint="Se guarda solo mientras escribís" right={<Quote className="w-6 h-6 text-white/55" />} />
                    <textarea value={notes} onChange={(e) => { notesTouched.current = true; setNotes(e.target.value); }} placeholder="¿Qué te pareció? Escribí tu opinión personal..." rows={6} className="glass-input !text-lg !leading-relaxed !p-5 !rounded-[1.75rem]" />
                  </section>

                  {sessions.length > 0 && (
                    <section className="border-t border-white/20 pt-6">
                      <Head title="Tus vistas" hint="Cada vez que la viste" />
                      <div className="space-y-4">
                        {sessions.map((session) => {
                          const isJustSaved = session.id === justSavedId;
                          const d = session.watched_date ? new Date(`${session.watched_date}T00:00:00`) : null;
                          return (
                            <div key={session.id} id={`session-${session.id}`} className={`liquid-glass relative rounded-[2rem] overflow-hidden grid md:grid-cols-[150px_minmax(0,1fr)_auto] items-center ${isJustSaved ? "animate-saved-flash" : ""}`}>
                              <div className="relative self-stretch flex flex-col items-center justify-center py-5 md:py-0" style={{ background: `linear-gradient(160deg, ${tone.accent}, hsl(${hueB} 80% 55%))`, color: "#111" }}>
                                <span className="font-cinema text-6xl leading-none">{d ? d.getDate() : "—"}</span>
                                <span className="text-xs font-extrabold uppercase tracking-widest mt-1">{d ? d.toLocaleDateString("es-AR", { month: "short", year: "numeric" }) : "sin fecha"}</span>
                              </div>
                              <div className="p-5 md:p-6 min-w-0">
                                <div className="flex flex-wrap gap-2.5 text-sm font-bold">
                                  <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full"><MapPin className="w-4 h-4" style={{ color: HABIT_GROUPS.venue.color }} /> {VENUE_LABELS[session.venue]}</span>
                                  <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full"><Users className="w-4 h-4" style={{ color: HABIT_GROUPS.companionship.color }} /> {COMPANIONSHIP_LABELS[session.companionship]}</span>
                                  {session.platform !== "unknown" && <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full"><MonitorPlay className="w-4 h-4" style={{ color: HABIT_GROUPS.platform.color }} /> {PLATFORM_LABELS[session.platform]}</span>}
                                  {session.language_mode !== "unknown" && <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full"><Languages className="w-4 h-4" style={{ color: HABIT_GROUPS.language.color }} /> {LANGUAGE_MODE_LABELS[session.language_mode]}</span>}
                                  {session.is_rewatch && <span className="liquid-glass-sm inline-flex items-center gap-2 px-4 py-2 rounded-full"><Repeat className="w-4 h-4" /> Re-ver</span>}
                                </div>
                                <div className="mt-4"><Stars value={session.rating ?? 0} hover={0} size={22} readOnly /></div>
                              </div>
                              <div className="flex md:flex-col gap-2 p-5 md:p-6 md:pl-0">
                                <button onClick={() => startEditSession(session)} disabled={savingSession} className={`${glassBtn} !h-11`}><Pencil className="w-4 h-4" /> Editar</button>
                                <button onClick={() => handleDeleteSession(session.id)} disabled={savingSession} className={`${glassBtn} !h-11`} style={{ color: "#fca5a5" }}><Trash2 className="w-4 h-4" /> Borrar</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section className="border-t border-white/20 pt-6">
                    <Head title={editingSessionId ? "Editar sesión" : "Agregar sesión"} hint="Contanos dónde y cómo la viste: ayuda a tu ADN Audiovisual"
                      right={<span className="flex items-center gap-3">{editingSessionId && <button onClick={resetSessionDraft} className="text-sm font-extrabold underline underline-offset-4 hover:opacity-70">Cancelar edición</button>}<HelpTooltip text={HOW_YOU_WATCHED_HELP} /></span>} />

                    <div className="grid gap-8 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                      <div className="space-y-8">
                        <div>
                          <p className="text-sm font-extrabold mb-3 inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> ¿Cuándo la viste?</p>
                          <div className="flex gap-3">
                            <input type="date" value={draft.watchedDate} onChange={(e) => setDraft((d) => ({ ...d, watchedDate: e.target.value }))} className="glass-input flex-1 !h-14 !text-base" />
                            <input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} className="glass-input !w-32 !h-14 !text-base" placeholder="Hora" />
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-white/60">La hora es opcional. Si la completás, se guarda la zona horaria ({tzValue || "del navegador"}).</p>
                        </div>
                        <div>
                          <p className="text-sm font-extrabold mb-3 inline-flex items-center gap-2"><Star className="w-4 h-4" /> Nota de esta vista</p>
                          <Stars value={sessionRating} hover={sessionHover} size={38} onPick={(n) => setSessionRating(sessionRating === n ? 0 : n)} onHover={setSessionHover} />
                        </div>
                        {reactionTags.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <p className="text-sm font-extrabold">¿Qué te dejó?</p>
                              <span className="text-xs text-white/60">{selectedReactions.length}/3 elegidas</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {reactionTags.map((tag) => {
                                const selected = selectedReactions.includes(tag.slug);
                                const locked = !selected && selectedReactions.length >= 3;
                                return (
                                  <button key={tag.slug} type="button" role="switch" aria-checked={selected} tabIndex={locked ? -1 : 0} onClick={() => toggleReaction(tag)}
                                    onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!locked) toggleReaction(tag); } }}
                                    disabled={savingSession || locked}
                                    className="px-5 h-11 rounded-full text-sm font-extrabold border transition-all disabled:opacity-40"
                                    style={selected ? { background: accentGrad, color: "#111", borderColor: "transparent" } : { background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.2)" }}>{tag.name}</button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-8 min-w-0">
                        <PillGroup accent={accentGrad} groupKey="venue" pills={VENUE_PILLS} selected={draft.venue} onSelect={(value) => setDraft((d) => ({ ...d, venue: value as ViewingVenue }))} />
                        <PillGroup accent={accentGrad} groupKey="companionship" pills={COMPANIONSHIP_PILLS} selected={draft.companionship} onSelect={(value) => setDraft((d) => ({ ...d, companionship: value as ViewingCompanionship }))} />
                        <PillGroup accent={accentGrad} groupKey="language" pills={LANGUAGE_MODE_PILLS} selected={draft.languageMode} onSelect={(value) => setDraft((d) => ({ ...d, languageMode: value as ViewingLanguageMode }))} />
                        <PillGroup accent={accentGrad} groupKey="platform" pills={PLATFORM_PILLS} selected={draft.platform} onSelect={(value) => setDraft((d) => ({ ...d, platform: value as ViewingPlatform }))} />
                        <PillGroup accent={accentGrad} groupKey="rewatch" pills={REWATCH_PILLS} selected={draft.isRewatch ? "rewatch" : "first"} onSelect={(value) => setDraft((d) => ({ ...d, isRewatch: value === "rewatch" }))} />
                      </div>
                    </div>

                    {sessionError && <p className="text-sm font-bold text-red-300 mt-6">{sessionError}</p>}

                    <button onClick={handleSaveSession} disabled={savingSession}
                      className={`mt-8 w-full inline-flex items-center justify-center gap-2.5 h-16 rounded-full text-base font-extrabold transition-transform hover:scale-[1.01] disabled:opacity-50 ${sessionSaved ? "animate-pop" : ""}`}
                      style={sessionSaved ? { backgroundColor: "#4ade80", color: "#052e16", boxShadow: "0 8px 28px rgba(74,222,128,.45)" } : { background: accentGrad, color: "#111", boxShadow: `0 14px 40px -10px ${tone.glow}` }}>
                      {sessionSaved ? (<><Check className="w-5 h-5" strokeWidth={3} />{editingSessionId ? "Cambios guardados" : "Sesión guardada"}</>)
                        : savingSession ? (<><RotateCw className="w-5 h-5 animate-spin" />Guardando...</>)
                        : (<><Plus className="w-5 h-5" />{editingSessionId ? "Guardar cambios" : "Guardar sesión"}</>)}
                    </button>
                  </section>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
