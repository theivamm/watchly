import type { RGB } from "@/lib/posterColor";

/** Tono (0-360) de un color promedio; cae al violeta de la marca si el color es casi gris. */
export function hueFromRgb({ r, g, b }: RGB, fallback = 265): number {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn), d = max - min;
  if (d < 0.06) return fallback;
  let h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

/** Variables CSS que reemplazan la paleta de acento de toda la app. */
export function accentVars(hue: number): Record<string, string> {
  const h = (n: number) => (hue + n + 360) % 360;
  return {
    "--accent-h": String(hue),
    "--accent": `hsl(${hue} 80% 66%)`,
    "--accent-2": `hsl(${h(15)} 80% 62%)`,
    "--accent-3": `hsl(${h(30)} 85% 74%)`,
    "--accent-light": `hsl(${hue} 90% 84%)`,
    "--accent-soft": `hsl(${hue} 80% 60% / 0.16)`,
    "--focus-ring": `hsl(${hue} 80% 66% / 0.4)`,
    "--gradient-accent": `linear-gradient(135deg, hsl(${hue} 80% 60%) 0%, hsl(${h(20)} 80% 66%) 55%, hsl(${h(40)} 85% 74%) 100%)`,
    "--gradient-accent-soft": `linear-gradient(135deg, hsl(${hue} 80% 60% / 0.18), hsl(${h(30)} 80% 60% / 0.12))`,
    "--gradient-text": `linear-gradient(120deg, hsl(${hue} 90% 84%) 0%, hsl(${hue} 80% 66%) 45%, hsl(${h(40)} 90% 76%) 100%)`,
    "--glow-violet": `hsl(${hue} 80% 55% / 0.22)`,
    "--glow-purple": `hsl(${h(20)} 80% 55% / 0.14)`,
    "--glow-pink": `hsl(${h(40)} 80% 55% / 0.1)`,
  };
}
