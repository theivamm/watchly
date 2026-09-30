import "@/styles/cinema.css";
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
  badge?: string;
  notes?: string | null;
}

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

export default function MediaCard({
  title,
  posterPath,
  year,
  mediaType = "movie",
  rating,
  tmdbRating,
  status,
  onClick,
  badge,
  notes,
}: MediaCardProps) {
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
      className="frost-card relative text-left group w-full rounded-[1.9rem] cursor-pointer p-2.5 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
    >
      {/* Color del póster filtrándose por el vidrio al hacer hover */}
      <img src={posterUrl} alt="" aria-hidden="true" loading="lazy"
        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-0 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" />

      <div className="relative aspect-[2/3] rounded-[1.4rem] overflow-hidden">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {status && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[11px] font-extrabold liquid-glass-sm text-white"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status] }} />
            {STATUS_LABELS[status]}
          </span>
        )}
        {!status && badge && (
          <span className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold bg-white text-[#111]">
            {badge}
          </span>
        )}
        {showTmdb && (
          <span className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold liquid-glass-sm text-white">
            ★ {tmdbRating!.toFixed(1)}
          </span>
        )}
      </div>

      <div className="relative px-2 pt-3 pb-1.5">
        <p className="text-sm font-extrabold truncate text-white">{title}</p>
        <p className="text-xs mt-1 font-medium text-white/65">
          {year || ""}
          {year && mediaType && " · "}
          {mediaType === "movie" ? "Película" : "Serie"}
          {rating != null && ` · ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
        </p>
        {notes ? <p className="text-xs mt-1.5 leading-snug line-clamp-2 text-white/70">{notes}</p> : null}
      </div>
    </div>
  );
}
