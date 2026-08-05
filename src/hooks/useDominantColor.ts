import { useState, useEffect } from "react";

const cache = new Map<string, string>();

function hslToRgb(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c);
  };
  return `rgb(${f(0)},${f(8)},${f(4)})`;
}

function hashColor(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) >>> 0;
  return hslToRgb(h % 360, 0.72, 0.55);
}

export function useDominantColor(imageUrl: string | null): string | null {
  const [color, setColor] = useState<string | null>(() =>
    imageUrl ? cache.get(imageUrl) || null : null
  );

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }
    if (cache.has(imageUrl)) {
      setColor(cache.get(imageUrl)!);
      return;
    }

    let cancelled = false;

    const computeColor = (source: CanvasImageSource, width: number, height: number) => {
      const w = 32;
      const h = Math.max(1, Math.round((height / width) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(source, 0, 0, w, h);

      const { data } = ctx.getImageData(0, 0, w, h);
      const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness < 25 || brightness > 235) continue;
        const key = `${Math.round(r / 16) * 16},${Math.round(g / 16) * 16},${Math.round(b / 16) * 16}`;
        const cur = buckets.get(key);
        if (cur) cur.count++;
        else buckets.set(key, { r, g, b, count: 1 });
      }

      let best: { r: number; g: number; b: number; count: number } | null = null;
      for (const v of buckets.values()) {
        if (!best || v.count > best.count) best = v;
      }

      if (best) {
        const c = `rgb(${best.r},${best.g},${best.b})`;
        cache.set(imageUrl, c);
        if (!cancelled) setColor(c);
      }
    };

    const run = async () => {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;

        try {
          const bitmap = await createImageBitmap(blob);
          if (cancelled) {
            bitmap.close();
            return;
          }
          computeColor(bitmap, bitmap.width, bitmap.height);
          bitmap.close();
        } catch {
          const url = URL.createObjectURL(blob);
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = () => reject(new Error("load failed"));
              i.src = url;
            });
            if (!cancelled) computeColor(img, img.width, img.height);
          } finally {
            URL.revokeObjectURL(url);
          }
        }
      } catch {
        /* ignore network/canvas errors */
      }

      if (!cancelled && !cache.has(imageUrl)) {
        const c = hashColor(imageUrl);
        cache.set(imageUrl, c);
        setColor(c);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

export function toGlow(aura: string, alpha = 0.5): string {
  return aura.replace("rgb", "rgba").replace(")", `,${alpha})`);
}
