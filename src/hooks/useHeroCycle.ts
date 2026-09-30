import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TINT, getDominantColor, lighten, rgba, type RGB } from "@/lib/posterColor";
import { getPosterUrl } from "@/services/tmdb";

/** Rota entre títulos y expone el color de énfasis sacado del póster activo. */
export function useHeroCycle(posters: (string | null)[], ms = 8000) {
  const count = posters.length;
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);
  const startRef = useRef(0);
  const cache = useRef<Record<string, RGB>>({});

  useEffect(() => {
    if (count <= 1) return;
    startRef.current = performance.now();
    const t = setInterval(() => {
      const elapsed = performance.now() - startRef.current;
      if (elapsed >= ms) {
        setIndex((i) => (i + 1) % count);
        startRef.current = performance.now();
        setProgress(0);
      } else {
        setProgress((elapsed / ms) * 100);
      }
    }, 100);
    return () => clearInterval(t);
  }, [count, ms]);

  const select = useCallback((i: number) => {
    setIndex(i);
    setProgress(0);
    startRef.current = performance.now();
  }, []);

  const activePoster = posters[index] ?? null;
  useEffect(() => {
    if (!activePoster) return;
    const cached = cache.current[activePoster];
    if (cached) return setTint(cached);
    let cancelled = false;
    getDominantColor(getPosterUrl(activePoster, "w200")).then((c) => {
      cache.current[activePoster] = c;
      if (!cancelled) setTint(c);
    });
    return () => { cancelled = true; };
  }, [activePoster]);

  const bright = lighten(tint, 0.4);
  return {
    index,
    progress,
    select,
    accent: `rgb(${bright.r},${bright.g},${bright.b})`,
    accentGlass: rgba(tint, 0.45),
    glow: rgba(tint, 0.55),
    glow2: rgba(lighten(tint, 0.15), 0.45),
    row: rgba(tint, 0.5),
  };
}
