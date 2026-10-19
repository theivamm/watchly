import "@/styles/cinema.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTrending } from "@/hooks/useMedia";
import { DEFAULT_TINT, getDominantColor } from "@/lib/posterColor";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";
import { accentVars, hueFromRgb } from "@/lib/tone";
import { usePrevIndex } from "@/components/home/HeroBackdrop";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Anti-parpadeo mobile (no revertir): en mobile el fondo queda fijo. El fundido de una imagen
// a pantalla completa con blur, detrás de paneles con backdrop-filter, más el cambio de
// --accent-* en toda la app, obligaba a repintar la página entera en cada rotación.
const STATIC_QUERY = "(max-width: 767px), (prefers-reduced-motion: reduce)";

function useStaticAmbient() {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(STATIC_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(STATIC_QUERY);
    const sync = () => setOn(mq.matches);
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return on;
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
  const isStatic = useStaticAmbient();

  useEffect(() => {
    if (isStatic || items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), intervalMs);
    return () => clearInterval(t);
  }, [items.length, intervalMs, isStatic]);

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
  // Solo la activa, la saliente y la siguiente existen en el DOM; las demás no consumen GPU.
  const prev = usePrevIndex(index);
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden bg-[#07070d] pointer-events-none" style={{ contain: "strict" }}>
      {items.map((it, i) => (i === index || i === prev || (items.length > 1 && i === (index + 1) % items.length)) && (
        <img
          key={`${it.mediaType}-${it.tmdbId}`}
          src={it.backdropPath ? getBackdropUrl(it.backdropPath, "w780") : getPosterUrl(it.posterPath, "w500")}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover cinema-kenburns"
          style={{
            opacity: i === index ? 0.85 : 0,
            transition: "opacity 2.6s ease-in-out",
            filter: "blur(90px) saturate(1.5)",
            transform: "scale(1.4) translateZ(0)",
            willChange: "opacity",
          }}
        />
      ))}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.5), rgba(7,7,13,.62))" }} />
      <div className="absolute inset-0 md:hidden" style={{ background: "rgba(7,7,13,.3)" }} />
    </div>
  );
}
