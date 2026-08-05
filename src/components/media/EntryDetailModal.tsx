import { X, Star, Film, Tv, Plus } from "lucide-react";
import { getPosterUrl } from "@/services/tmdb";
import type { Entry, EntryStatus } from "@/types";

interface EntryDetailModalProps {
  entry: Entry;
  onClose: () => void;
  onAction?: () => void;
}

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

export default function EntryDetailModal({ entry, onClose, onAction }: EntryDetailModalProps) {
  const rating = entry.rating;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      style={{ backgroundColor: "rgba(5,5,12,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border animate-pop"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--surface-1)",
          borderColor: "rgba(139,92,246,0.35)",
          boxShadow: "0 0 0 1px rgba(139,92,246,0.15), 0 40px 80px -20px rgba(139,92,246,0.5), 0 0 120px 20px rgba(139,92,246,0.15)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ backgroundColor: "rgba(11,11,20,0.6)", border: "1px solid var(--border)", color: "#fff", backdropFilter: "blur(6px)" }}
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Poster */}
          <div className="relative sm:w-44 shrink-0">
            <img
              src={getPosterUrl(entry.poster_path)}
              alt={entry.title}
              className="w-full h-48 sm:h-full object-cover"
            />
            <div
              className="absolute inset-0 sm:bg-none"
              style={{ background: "linear-gradient(0deg, var(--surface-1) 0%, transparent 40%)" }}
            />
            <div
              className="absolute inset-0 hidden sm:block"
              style={{ background: "linear-gradient(90deg, transparent 60%, var(--surface-1) 100%)" }}
            />
          </div>

          {/* Content */}
          <div className="relative flex-1 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                style={{ backgroundColor: STATUS_COLORS[entry.status], color: "#000" }}
              >
                {STATUS_LABELS[entry.status]}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {entry.media_type === "movie" ? (
                  <span className="inline-flex items-center gap-1"><Film className="w-3 h-3" /> Película</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Tv className="w-3 h-3" /> Serie</span>
                )}
              </span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
              {entry.title}
            </h2>

            {rating != null && rating > 0 && (
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4"
                    style={{
                      fill: rating >= star ? "var(--accent)" : "none",
                      color: rating >= star ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  />
                ))}
                <span className="ml-2 text-sm font-bold" style={{ color: "#c4b5fd" }}>
                  {rating}/5
                </span>
              </div>
            )}

            {entry.notes ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Descripción
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                  {entry.notes}
                </p>
              </>
            ) : (
              <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                Sin descripción.
              </p>
            )}

            {onAction && (
              <button
                onClick={onAction}
                className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px rgba(139,92,246,0.55)" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.6} /> Agregar a mi biblioteca
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
