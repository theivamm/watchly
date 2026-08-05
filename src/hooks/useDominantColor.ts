import { useState, useEffect } from "react";

const cache = new Map<string, string>();

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
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const w = 32;
        const h = Math.max(1, Math.round((img.height / img.width) * w));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
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
      } catch {
        /* ignore canvas errors */
      }
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}

export function toGlow(aura: string, alpha = 0.5): string {
  return aura.replace("rgb", "rgba").replace(")", `,${alpha})`);
}
