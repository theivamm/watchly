import { Plus, Quote, Star } from "lucide-react";
import { getPosterUrl } from "@/services/tmdb";
import type { Entry } from "@/types";

const STATUS_LABELS: Record<Entry["status"], string> = {
  want_to_watch: "Quiero ver",
  watching: "Viendo",
  completed: "Completado",
  paused: "Pausado",
  dropped: "Abandonado",
};

const STATUS_COLORS: Record<Entry["status"], string> = {
  want_to_watch: "var(--accent)",
  watching: "#4ade80",
  completed: "#60a5fa",
  paused: "#facc15",
  dropped: "#f87171",
};

interface EntryCardProps {
  entry: Entry;
  onClick?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

export default function EntryCard({ entry, onClick, onAction, actionLabel = "Agregar" }: EntryCardProps) {
  const posterUrl = getPosterUrl(entry.poster_path, "w342");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onClick) onClick();
      }}
      className="group relative glass rounded-[1.5rem] p-4 flex gap-4 text-left cursor-pointer transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: "0 16px 40px -18px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)" }}
    >
      {/* Poster */}
      <div className="relative w-24 md:w-28 shrink-0 aspect-[2/3] rounded-xl overflow-hidden border"
        style={{ borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
        <img
          src={posterUrl}
          alt={entry.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="relative min-w-0 flex-1 flex flex-col">
        {entry.status && (
          <span
            className="self-start inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold mb-2"
            style={{ backgroundColor: STATUS_COLORS[entry.status], color: "#000" }}
          >
            {STATUS_LABELS[entry.status]}
          </span>
        )}

        <h3 className="text-base font-extrabold leading-tight" style={{ color: "var(--text-primary)" }}>
          {entry.title}
        </h3>

        {entry.rating != null && (
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className="w-4 h-4"
                fill={n <= entry.rating! ? "var(--accent)" : "none"}
                stroke={n <= entry.rating! ? "var(--accent)" : "var(--border)"}
              />
            ))}
          </div>
        )}

        {entry.description && (
          <p className="text-sm leading-relaxed mt-2 line-clamp-4" style={{ color: "var(--text-secondary)" }}>
            {entry.description}
          </p>
        )}

        {entry.notes && (
          <div className="mt-3 rounded-xl border p-3"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
            <Quote className="w-3.5 h-3.5 mb-1.5" style={{ color: "var(--accent-light)" }} />
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>{entry.notes}</p>
          </div>
        )}

        {onAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="self-start inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-full text-xs font-bold transition-all hover:scale-105 cursor-pointer"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 6px 18px color-mix(in srgb, var(--accent) 50%, transparent)" }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.6} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
