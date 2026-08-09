import { Star } from "lucide-react";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

interface HorizontalMediaCardProps {
  item: TMDBSearchResult;
  onClick?: () => void;
}

export default function HorizontalMediaCard({ item, onClick }: HorizontalMediaCardProps) {
  const imgUrl =
    item.backdropPath != null
      ? getBackdropUrl(item.backdropPath, "w780")
      : getPosterUrl(item.posterPath, "w500");

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full h-full text-left poster-card rounded-2xl cursor-pointer"
      style={{
        backgroundColor: "var(--surface-1)",
        border: "1px solid var(--border)",
        padding: "0.75rem",
      }}
    >
      {/* Blurred cover backdrop on hover */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
        <img
          src={imgUrl}
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

      <div className="relative z-10 w-full aspect-video rounded-xl overflow-hidden">
        <img
          src={imgUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          style={{ filter: "saturate(1.05)" }}
        />

        {/* Dark gradient for readability */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.15) 0%, rgba(11,11,20,0.55) 70%, rgba(11,11,20,0.85) 100%)" }}
        />

        {/* Rating chip */}
        {item.tmdbRating != null && item.tmdbRating > 0 && (
          <span
            className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-extrabold backdrop-blur-md"
            style={{
              backgroundColor: "rgba(11,11,20,0.7)",
              color: "var(--accent-light)",
              border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            <span className="inline-flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {item.tmdbRating.toFixed(1)}
            </span>
          </span>
        )}

        {/* Type chip */}
        <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
          style={{ backgroundColor: "rgba(11,11,20,0.65)", color: "#f4f4f5", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          {item.mediaType === "movie" ? "Película" : "Serie"}
          {item.year ? ` · ${item.year}` : ""}
        </span>
      </div>

      <div className="relative z-10 px-1 pt-3 pb-1">
        <h3 className="text-sm md:text-base font-extrabold truncate transition-colors group-hover:text-[var(--accent-light)]"
          style={{ color: "var(--text-primary)" }}>
          {item.title}
        </h3>
      </div>
    </button>
  );
}
