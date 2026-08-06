import { useState, useEffect, useRef } from "react";
import { X, Star, ListPlus, ChevronDown, Check, Sparkles, Quote } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getPosterUrl, getMediaDetails } from "@/services/tmdb";
import { addToLibrary, updateEntry, removeFromLibrary, getEntry } from "@/services/library";
import { getUserLists, addItemToList } from "@/services/lists";
import type { TMDBSearchResult, Entry, EntryStatus, MediaType, List } from "@/types";

interface MediaDetailModalProps {
  result: TMDBSearchResult;
  onClose: () => void;
  onSaved?: (entry: Entry) => void;
}

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: "want_to_watch", label: "Quiero ver" },
  { value: "watching", label: "Viendo" },
  { value: "completed", label: "Completado" },
  { value: "paused", label: "Pausado" },
  { value: "dropped", label: "Abandonado" },
];

const STATUS_COLORS: Record<EntryStatus, string> = {
  want_to_watch: "var(--accent)",
  watching: "#4ade80",
  completed: "#60a5fa",
  paused: "#facc15",
  dropped: "#f87171",
};

export default function MediaDetailModal({ result, onClose, onSaved }: MediaDetailModalProps) {
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
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedToListId, setAddedToListId] = useState<string | null>(null);
  const [fetchingDesc, setFetchingDesc] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const posterUrl = getPosterUrl(result.posterPath, "w500");

  useEffect(() => {
    if (!user) return;
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
  }, [user, result.tmdbId, result.mediaType]);

  useEffect(() => {
    setDescription(result.overview || "");
  }, [result.overview]);

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
    if (!user) return;
    getUserLists(user.id).then(setLists).catch(console.error);
  }, [user]);

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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div
        className="relative w-full max-w-3xl rounded-3xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft blurred cover backdrop - covers full modal, outside scroll */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <img
            src={posterUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-30"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(19,19,31,0.65) 0%, rgba(19,19,31,0.25) 50%, rgba(19,19,31,0.85) 100%)",
            }}
          />
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 max-h-[90vh] overflow-y-auto p-6 md:p-8 pb-24">
        <div className="flex justify-end sticky top-0 mb-4">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--text-primary)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            {/* Left: big image */}
            <div className="mx-auto sm:mx-0 w-56 sm:w-64 md:w-72 lg:w-80 shrink-0">
              <div
                className="w-full aspect-[2/3] rounded-2xl overflow-hidden border"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
                  boxShadow: "0 24px 60px -12px rgba(0,0,0,0.65)",
                }}
              >
                <img src={posterUrl} alt={result.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Right: content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
                {result.title}
              </h2>
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
                {result.year || "Sin año"} · {result.mediaType === "movie" ? "Película" : "Serie"}
              </p>

              <div className="space-y-6">
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Descripción
                    </p>
                    <button
                      onClick={fillDescription}
                      disabled={fetchingDesc}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:scale-[1.03] disabled:opacity-60"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
                        color: "var(--accent-light)",
                        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                      }}
                    >
                      <Sparkles className="w-3 h-3" />
                      {fetchingDesc ? "Buscando..." : "Obtener automáticamente"}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {description || "Sin descripción disponible. Tocá “Obtener automáticamente” para cargarla desde TMDB."}
                  </p>
                </div>

                {/* Personal comment */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Quote className="w-3.5 h-3.5" style={{ color: "var(--accent-light)" }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Mi comentario
                    </p>
                  </div>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escribí un breve comentario personal sobre esta película..."
                    rows={3}
                    className="w-full !rounded-xl !text-sm !p-3 resize-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-primary)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  />
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
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
                          border: `1.5px solid ${status === s.value ? STATUS_COLORS[s.value] : "var(--border)"}`,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <p className="text-xs font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Calificación
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(rating === star ? 0 : star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className="w-7 h-7"
                          fill={(hoverRating || rating) >= star ? "var(--accent)" : "none"}
                          stroke={(hoverRating || rating) >= star ? "var(--accent)" : "var(--text-secondary)"}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lists */}
                <div ref={dropdownRef} className="relative">
                  <p className="text-xs font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Agregar a lista
                  </p>
                  <button
                    onClick={() => setShowListDropdown((v) => !v)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <ListPlus className="w-4 h-4" />
                      {addedToListId ? "¡Agregado!" : "Seleccionar lista..."}
                    </span>
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  </button>
                  {showListDropdown && (
                    <div
                      className="absolute z-10 mt-2 w-full rounded-xl border overflow-hidden"
                      style={{
                        backgroundColor: "rgba(19,19,31,0.95)",
                        borderColor: "var(--border)",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                      }}
                    >
                      {lists.length === 0 ? (
                        <div className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                          No tenés listas aún
                        </div>
                      ) : (
                        lists.map((list) => (
                          <button
                            key={list.id}
                            onClick={() => handleAddToList(list.id)}
                            disabled={addingToList === list.id}
                            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-bold transition-colors text-left"
                            style={{
                              color: "var(--text-primary)",
                              backgroundColor:
                                addedToListId === list.id ? "rgba(74,222,128,0.1)" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (addedToListId !== list.id) {
                                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (addedToListId !== list.id) {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }
                            }}
                          >
                            <span className="truncate">{list.name}</span>
                            {addedToListId === list.id ? (
                              <Check className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                            ) : addingToList === list.id ? (
                              <div
                                className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                                style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }}
                              />
                            ) : null}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {saveError && (
                  <div
                    className="px-4 py-3 rounded-xl text-xs font-bold"
                    style={{
                      backgroundColor: "rgba(248,113,113,0.12)",
                      border: "1.5px solid rgba(248,113,113,0.4)",
                      color: "#f87171",
                    }}
                  >
                    {saveError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex-1 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{
                      background: "var(--gradient-accent)",
                      color: "#fff",
                      boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
                    }}
                  >
                    {saving ? "Guardando..." : existingEntry ? "Actualizar" : "Guardar en biblioteca"}
                  </button>
                  {existingEntry && (
                    <button
                      onClick={handleRemove}
                      disabled={saving}
                      className="px-4 py-3 rounded-full text-sm font-bold transition-opacity disabled:opacity-50"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: "#f87171",
                        border: "1.5px solid var(--border)",
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
