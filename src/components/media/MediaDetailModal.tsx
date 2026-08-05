import { useState, useEffect, useRef } from "react";
import { X, Star, ListPlus, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getPosterUrl } from "@/services/tmdb";
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
  const [existingEntry, setExistingEntry] = useState<Entry | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [lists, setLists] = useState<List[]>([]);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedToListId, setAddedToListId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    getEntry(user.id, result.tmdbId, result.mediaType as MediaType)
      .then((entry) => {
        if (entry) {
          setExistingEntry(entry);
          setStatus(entry.status);
          setRating(entry.rating ?? 0);
          setNotes(entry.notes ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [user, result.tmdbId, result.mediaType]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{
          backgroundColor: "var(--surface-1)",
          border: "1px solid rgba(139,92,246,0.25)",
          boxShadow: "0 30px 80px -20px rgba(139,92,246,0.4)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-5 mb-6">
          <img
            src={getPosterUrl(result.posterPath, "w342")}
            alt={result.title}
            className="w-28 rounded-xl object-cover flex-shrink-0"
            style={{ aspectRatio: "2/3" }}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>
              {result.title}
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              {result.year} · {result.mediaType === "movie" ? "Película" : "Serie"}
            </p>
            {result.overview && (
              <p className="text-xs leading-relaxed line-clamp-4" style={{ color: "var(--text-secondary)" }}>
                {result.overview}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
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
                    backgroundColor: status === s.value ? STATUS_COLORS[s.value] : "var(--surface-2)",
                    color: status === s.value ? "#000" : "var(--text-secondary)",
                    border: `1.5px solid ${status === s.value ? STATUS_COLORS[s.value] : "var(--border)"}`,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <p className="text-xs font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Descripción
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribí tu descripción, opinión o progreso..."
              rows={3}
              className="w-full !rounded-xl !text-sm !p-3 resize-none"
              style={{
                backgroundColor: "var(--surface-2)",
                border: "1.5px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div ref={dropdownRef} className="relative">
            <p className="text-xs font-bold mb-2.5 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              Agregar a lista
            </p>
            <button
              onClick={() => setShowListDropdown((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all"
              style={{
                backgroundColor: "var(--surface-2)",
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
                  backgroundColor: "var(--surface-1)",
                  borderColor: "var(--border)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
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
                          e.currentTarget.style.backgroundColor = "var(--surface-2)";
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
                boxShadow: "0 4px 18px rgba(139,92,246,0.45)",
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
                  backgroundColor: "var(--surface-2)",
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
  );
}
