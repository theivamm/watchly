import { Plus, Star, Play, Trash2 } from "lucide-react";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

interface HorizontalMediaCardProps {
  item: TMDBSearchResult;
  onClick?: () => void;
  added?: boolean;
  onRemove?: () => void;
}

export default function HorizontalMediaCard({ item, onClick, added = false, onRemove }: HorizontalMediaCardProps) {
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
              color: "#c4b5fd",
              border: "1px solid rgba(139,92,246,0.3)",
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
          style={{ backgroundColor: "rgba(11,11,20,0.65)", color: "#f4f4f5", border: "1px solid rgba(139,92,246,0.2)" }}>
          {item.mediaType === "movie" ? "Película" : "Serie"}
          {item.year ? ` · ${item.year}` : ""}
        </span>
      </div>

      <div className="relative z-10 px-1 pt-3 pb-1">
        <h3 className="text-sm md:text-base font-extrabold truncate transition-colors group-hover:text-[#c4b5fd]"
          style={{ color: "var(--text-primary)" }}>
          {item.title}
        </h3>
        <div className="flex items-center gap-2 mt-3">
          {added ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold cursor-pointer transition-all duration-300 hover:scale-[1.03]"
              style={{
                backgroundColor: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.45)",
                color: "#fca5a5",
              }}
            >
              <Trash2 className="w-3 h-3" strokeWidth={2.6} />
              Quitar
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all duration-300"
              style={{
                background: "var(--gradient-accent)",
                color: "#fff",
                boxShadow: "0 6px 20px rgba(139,92,246,0.55)",
              }}
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
              Agregar
            </span>
          )}
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.22)",
              color: "#fff",
            }}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
