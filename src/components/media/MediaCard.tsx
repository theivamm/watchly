import { useState } from "react";
import { Plus, X } from "lucide-react";
import { getPosterUrl } from "@/services/tmdb";
import type { MediaType, EntryStatus } from "@/types";

interface MediaCardProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  year?: number | null;
  mediaType?: MediaType;
  rating?: number | null;
  tmdbRating?: number | null;
  status?: EntryStatus;
  onClick?: () => void;
  onAction?: () => void;
  onRemove?: () => void;
  badge?: string;
  notes?: string | null;
  actionLabel?: string;
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

export default function MediaCard({
  title,
  posterPath,
  year,
  mediaType = "movie",
  rating,
  tmdbRating,
  status,
  onClick,
  onAction,
  onRemove,
  badge,
  notes,
  actionLabel = "Agregar",
}: MediaCardProps) {
  const [confirming, setConfirming] = useState(false);
  const posterUrl = getPosterUrl(posterPath);
  const showTmdb = tmdbRating != null && tmdbRating > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onClick) onClick();
      }}
      className="relative text-left group w-full poster-card rounded-2xl cursor-pointer"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border)",
        padding: "0.75rem",
      }}
    >
      {/* Blurred cover backdrop on hover */}
      <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <img
          src={posterUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
          loading="lazy"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.12) 0%, rgba(11,11,20,0.65) 100%)" }}
        />
      </div>

      <div className="relative z-10 aspect-[2/3] rounded-xl overflow-hidden">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Rating badge (top-right) */}
        {showTmdb && (
          <span
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold backdrop-blur-md"
            style={{ backgroundColor: "rgba(11,11,20,0.7)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}
          >
            {tmdbRating!.toFixed(1)}★
          </span>
        )}

        {/* Status badge */}
        {status && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md"
            style={{ backgroundColor: STATUS_COLORS[status], color: "#000" }}
          >
            {STATUS_LABELS[status]}
          </span>
        )}

        {/* Custom badge */}
        {!status && badge && (
          <span
            className="absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-bold"
            style={{ background: "var(--gradient-accent)", color: "#fff" }}
          >
            {badge}
          </span>
        )}

        {/* Remove action (owner, desktop hover + mobile) */}
        {onRemove && !confirming && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              className="absolute inset-x-3 bottom-3 py-3 rounded-xl text-xs font-bold text-center opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", boxShadow: "0 8px 20px rgba(239,68,68,0.4)" }}
            >
              <X className="w-4 h-4" strokeWidth={2.6} /> Quitar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              aria-label="Quitar de la biblioteca"
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center md:hidden cursor-pointer"
              style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", boxShadow: "0 6px 16px rgba(239,68,68,0.45)" }}
            >
              <X className="w-4 h-4" strokeWidth={2.6} />
            </button>
          </>
        )}

        {/* Inline confirm on the card (no popups) */}
        {confirming && (
          <div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl"
            style={{ backgroundColor: "rgba(5,5,12,0.9)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-bold text-center px-4" style={{ color: "#fff" }}>
              ¿Quitar de tu biblioteca?
            </p>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                  onRemove?.();
                }}
                className="px-4 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-transform hover:scale-105"
                style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }}
              >
                Sí, quitar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(false);
                }}
                className="px-4 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-transform hover:scale-105"
                style={{ backgroundColor: "rgba(255,255,255,0.14)", color: "#fff" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Action overlay (desktop hover) */}
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="absolute inset-x-3 bottom-3 py-3 rounded-xl text-xs font-bold text-center opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 20px color-mix(in srgb, var(--accent) 50%, transparent)" }}
          >
            {actionLabel}
          </button>
        )}

        {/* Mobile + */}
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            aria-label={actionLabel}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center md:hidden cursor-pointer"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 6px 16px color-mix(in srgb, var(--accent) 50%, transparent)" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.6} />
          </button>
        )}
      </div>
      <div className="relative z-10 px-1 pt-3 pb-1">
        <p className="text-sm font-bold truncate transition-colors group-hover:text-[var(--accent-light)]"
          style={{ color: "var(--text-primary)" }}>
          {title}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
          {year || ""}
          {year && mediaType && " · "}
          {mediaType === "movie" ? "Película" : "Serie"}
          {rating != null && ` · ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
        </p>
        {notes ? (
          <p className="text-xs mt-1.5 leading-snug line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}
