import { useRef } from "react";
import { Plus } from "lucide-react";
import { getPosterUrl } from "@/services/tmdb";
import { useDominantColor, toGlow } from "@/hooks/useDominantColor";
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
  badge,
  notes,
  actionLabel = "Agregar",
}: MediaCardProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const posterUrl = getPosterUrl(posterPath);
  const aura = useDominantColor(posterUrl);
  const showTmdb = tmdbRating != null && tmdbRating > 0;

  const accent = aura ?? "rgba(139,92,246,0.5)";

  const handleEnter = () => {
    const el = posterRef.current;
    if (!el) return;
    el.style.boxShadow = `0 0 80px 16px ${toGlow(accent, 0.85)}, 0 18px 44px -12px rgba(0,0,0,0.6)`;
    el.style.borderColor = aura ?? "rgba(139,92,246,0.5)";
  };

  const handleLeave = () => {
    const el = posterRef.current;
    if (!el) return;
    el.style.boxShadow = "none";
    el.style.borderColor = "var(--border)";
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onClick) onClick();
      }}
      className="relative text-left group w-full poster-card rounded-2xl cursor-pointer"
    >
      {/* Full-card color halo on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{ boxShadow: `0 0 55px 10px ${toGlow(accent, 0.75)}, 0 0 22px 5px ${toGlow(accent, 0.5)}` }}
      />

      <div
        ref={posterRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="relative z-10 aspect-[2/3] rounded-2xl overflow-hidden mb-3 border"
        style={{ borderColor: "var(--border)", transition: "border-color 0.3s ease, box-shadow 0.3s ease" }}
      >
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Color wash on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(140% 120% at 50% 100%, ${toGlow(accent, 0.9)} 0%, ${toGlow(accent, 0.3)} 45%, transparent 75%)`,
          }} />

        {/* Rating badge (top-right) */}
        {showTmdb && (
          <span
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold backdrop-blur-md"
            style={{ backgroundColor: "rgba(11,11,20,0.7)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}
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

        {/* Action overlay (desktop hover) */}
        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="absolute inset-x-3 bottom-3 py-3 rounded-xl text-xs font-bold text-center opacity-0 md:group-hover:opacity-100 translate-y-2 md:group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 20px rgba(139,92,246,0.5)" }}
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
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 6px 16px rgba(139,92,246,0.5)" }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.6} />
          </button>
        )}
      </div>
      <div className="relative z-10 px-0.5">
        <p className="text-sm font-bold truncate transition-colors group-hover:text-[#c4b5fd]"
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
