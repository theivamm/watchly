import { useEffect, useRef } from "react";
import { getPosterUrl } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

interface HeroSliderProps {
  items: TMDBSearchResult[];
  glowColor?: string;
  onActiveChange?: (index: number) => void;
}

const STEP_GAP = 20; // gap-5

export default function HeroSlider({ items, glowColor = "color-mix(in srgb, var(--accent) 50%, transparent)", onActiveChange }: HeroSliderProps) {
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const updateActive = () => {
      const card = el.querySelector<HTMLElement>("[data-hero-card]");
      if (!card) return;
      const step = card.offsetWidth + STEP_GAP;
      const idx = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      onActiveChange?.(idx);
    };
    updateActive();
    el.addEventListener("scroll", updateActive, { passive: true });
    return () => el.removeEventListener("scroll", updateActive);
  }, [items.length, onActiveChange]);

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      const el = railRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-hero-card]");
      if (!card) return;
      const step = card.offsetWidth + STEP_GAP;
      const maxLeft = el.scrollWidth - el.clientWidth;
      const next = el.scrollLeft + step > maxLeft ? 0 : el.scrollLeft + step;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, 4500);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <div className="relative">
      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(11,11,20,0.8), transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
        style={{ background: "linear-gradient(270deg, rgba(11,11,20,0.8), transparent)" }} />

      <div
        ref={railRef}
        className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing select-none"
      >
        {items.map((item) => (
          <div
            key={item.tmdbId}
            data-hero-card
            className="relative w-[200px] sm:w-[225px] md:w-[250px] shrink-0 snap-start rounded-[1.75rem] overflow-hidden border transition-transform duration-300 hover:scale-[1.03]"
            style={{
              borderColor: "rgba(255,255,255,0.14)",
              backgroundColor: "var(--surface-2)",
              boxShadow: `0 30px 60px -18px rgba(0,0,0,0.85), 0 0 44px -6px ${glowColor}`,
            }}
          >
            <img
              src={getPosterUrl(item.posterPath, "w500")}
              alt={item.title}
              className="w-full aspect-[2/3] object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-x-0 bottom-0 p-3.5"
              style={{ background: "linear-gradient(180deg, transparent, rgba(5,5,12,0.88))" }}
            >
              <p className="text-[13px] font-bold leading-tight truncate" style={{ color: "#fff" }}>
                {item.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
