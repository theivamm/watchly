
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

/** Tarjeta de póster sin marco: la imagen manda y el color del póster se filtra como brillo al pasar el cursor. */
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
      className="relative text-left group w-full cursor-pointer text-white"
    >
      <div className="relative aspect-[2/3] transition-transform duration-500 group-hover:-translate-y-1.5">
        <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden border border-white/20 shadow-[0_22px_44px_-18px_rgba(0,0,0,.8)] bg-[#0c0a18]">
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {status && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full text-[11px] font-extrabold liquid-glass-sm text-white">
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
          {rating != null && rating > 0 && (
            <span className="absolute bottom-2.5 left-2.5 right-2.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold text-center liquid-glass-sm text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              {"★".repeat(rating)}{"☆".repeat(Math.max(0, 5 - rating))}
            </span>
          )}
        </div>
      </div>

      <div className="px-1 pt-3.5">
        <p className="text-sm font-extrabold truncate">{title}</p>
        <p className="text-xs mt-1 font-medium text-white/65 truncate">
          {year || ""}
          {year && mediaType && " · "}
          {mediaType === "movie" ? "Película" : "Serie"}
        </p>
        {notes ? <p className="text-xs mt-1.5 leading-snug line-clamp-2 text-white/70">{notes}</p> : null}
      </div>
    </div>
  );
}
