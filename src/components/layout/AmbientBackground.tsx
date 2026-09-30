import "@/styles/cinema.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTrending } from "@/hooks/useMedia";
import { DEFAULT_TINT, getDominantColor } from "@/lib/posterColor";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { accentVars, hueFromRgb } from "@/lib/tone";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Fondo global: portadas de películas al azar, muy desenfocadas, que además definen el color de énfasis de toda la app. */
export function useAmbient(intervalMs = 14000) {
  const { data } = useTrending("all");
  const items = useMemo(
    () => shuffle((data?.results || []).filter((i) => i.posterPath || i.backdropPath)).slice(0, 6),
    [data],
  );
  const [index, setIndex] = useState(0);
  const [hue, setHue] = useState(265);
  const cache = useRef<Record<string, number>>({});

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs]);

  const poster = items[index]?.posterPath ?? null;
  useEffect(() => {
    if (!poster) return;
    if (cache.current[poster] != null) return setHue(cache.current[poster]);
    let cancelled = false;
    getDominantColor(getPosterUrl(poster, "w200")).then((c) => {
      const h = hueFromRgb(c ?? DEFAULT_TINT);
      cache.current[poster] = h;
      if (!cancelled) setHue(h);
    });
    return () => { cancelled = true; };
  }, [poster]);

  return { items, index, hue, vars: accentVars(hue) };
}

export function AmbientLayer({ items, index }: { items: ReturnType<typeof useAmbient>["items"]; index: number }) {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-[#07070d] pointer-events-none">
      {items.map((it, i) => (
        <img
          key={`${it.mediaType}-${it.tmdbId}`}
          src={it.backdropPath ? getBackdropUrl(it.backdropPath, "w780") : getPosterUrl(it.posterPath, "w500")}
          alt=""
          className="absolute inset-0 w-full h-full object-cover cinema-kenburns"
          style={{
            opacity: i === index ? 0.85 : 0,
            transition: "opacity 2.6s ease-in-out",
            filter: "blur(90px) saturate(1.5)",
            transform: "scale(1.4)",
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.5), rgba(7,7,13,.62))" }} />
    </div>
  );
}
