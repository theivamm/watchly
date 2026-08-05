import { useRef } from "react";
import { Plus, Star, Play } from "lucide-react";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { useDominantColor, toGlow } from "@/hooks/useDominantColor";
import type { TMDBSearchResult } from "@/types";

interface HorizontalMediaCardProps {
  item: TMDBSearchResult;
  onClick?: () => void;
}

export default function HorizontalMediaCard({ item, onClick }: HorizontalMediaCardProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const imgUrl =
    item.backdropPath != null
      ? getBackdropUrl(item.backdropPath, "w780")
      : getPosterUrl(item.posterPath, "w500");
  const aura = useDominantColor(item.backdropPath != null ? imgUrl : null);

  const handleEnter = () => {
    const el = ref.current;
    if (!el) return;
    const base = aura ? toGlow(aura, 0.55) : "rgba(139,92,246,0.45)";
    el.style.boxShadow = `0 0 90px 14px ${base}, 0 24px 48px -12px rgba(0,0,0,0.7)`;
    if (aura) el.style.borderColor = aura;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.boxShadow = aura
      ? `0 0 55px 2px ${toGlow(aura, 0.35)}`
      : "0 0 45px 2px rgba(139,92,246,0.25)";
    el.style.borderColor = "rgba(139,92,246,0.2)";
  };

  const ambientGlow = aura
    ? `0 0 55px 2px ${toGlow(aura, 0.35)}`
    : "0 0 45px 2px rgba(139,92,246,0.25)";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="group relative w-full h-full overflow-hidden rounded-2xl text-left transition-all duration-300"
      style={{
        border: "1px solid rgba(139,92,246,0.2)",
        backgroundColor: "var(--surface-1)",
        cursor: "pointer",
        boxShadow: ambientGlow,
      }}
    >
      <img
        src={imgUrl}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
        style={{ filter: "saturate(1.05)" }}
      />

      {/* Dark gradient left-to-right for readability */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(90deg, rgba(11,11,20,0.92) 0%, rgba(11,11,20,0.5) 45%, rgba(11,11,20,0.1) 75%)",
        }}
      />

      {/* Glass sheen that appears on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "linear-gradient(180deg, rgba(139,92,246,0.12) 0%, rgba(11,11,20,0.05) 40%, rgba(11,11,20,0.55) 100%)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      />

      {/* Bottom color wash from dominant color */}
      {aura && (
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-40 group-hover:opacity-80 transition-opacity duration-500"
          style={{ background: `linear-gradient(0deg, ${toGlow(aura, 0.8)} 0%, transparent 100%)` }}
        />
      )}

      <div className="relative z-10 flex items-end w-full h-full p-4 md:p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {item.tmdbRating != null && item.tmdbRating > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-extrabold"
                style={{
                  backgroundColor: "rgba(11,11,20,0.65)",
                  color: "#c4b5fd",
                  border: "1px solid rgba(139,92,246,0.35)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <Star className="w-3 h-3 fill-current" />
                {item.tmdbRating.toFixed(1)}
              </span>
            )}
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
              {item.mediaType === "movie" ? "Película" : "Serie"}
              {item.year ? ` · ${item.year}` : ""}
            </span>
          </div>
          <h3
            className="text-base md:text-xl font-extrabold truncate transition-colors duration-300 group-hover:text-white"
            style={{ color: "#f4f4f5", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}
          >
            {item.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 ml-3">
          <span
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300"
            style={{
              background: "var(--gradient-accent)",
              color: "#fff",
              boxShadow: "0 6px 20px rgba(139,92,246,0.55)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.6} />
            Agregar
          </span>
          <span
            className="flex items-center justify-center w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}
