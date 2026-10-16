import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_TINT, getDominantColor, type RGB } from "@/lib/posterColor";
import { getPosterUrl } from "@/services/tmdb";

function rgbToHsl({ r, g, b }: RGB): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = Math.round(h * 60);
  return [h < 0 ? h + 360 : h, s, l];
}

/** Rota entre títulos y expone el color de énfasis sacado del póster activo. */
export function useHeroCycle(posters: (string | null)[], ms = 8000) {
  const count = posters.length;
  const [index, setIndex] = useState(0);
  // Cambia en cada avance; sirve de `key` para reiniciar la barra de progreso (animada por CSS,
  // no por estado: re-renderizar la página 10 veces por segundo la hacía parpadear en mobile).
  const [cycle, setCycle] = useState(0);
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);
  const cache = useRef<Record<string, RGB>>({});

  useEffect(() => {
    if (count <= 1) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
      setCycle((c) => c + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [count, ms, cycle]);

  const select = useCallback((i: number) => {
    setIndex(i);
    setCycle((c) => c + 1);
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

  // Pósters oscuros/grises dan un promedio sin color: forzamos saturación y luminosidad
  // para que el énfasis siempre se vea, y caemos al violeta de la marca si no hay tono.
  const [h0, s0] = rgbToHsl(tint);
  const hue = s0 < 0.1 ? rgbToHsl(DEFAULT_TINT)[0] : h0;
  const sat = Math.round(Math.min(90, Math.max(62, s0 * 100 + 25)));
  return {
    index,
    cycle,
    duration: ms,
    select,
    hue,
    accent: `hsl(${hue} ${sat}% 72%)`,
    accentGlass: `hsl(${hue} ${sat}% 50% / .45)`,
    glow: `hsl(${hue} ${sat}% 45% / .5)`,
    glow2: `hsl(${(hue + 40) % 360} ${sat}% 40% / .42)`,
    row: `hsl(${hue} ${sat}% 45% / .45)`,
  };
}
