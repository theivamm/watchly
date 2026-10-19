export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const DEFAULT_TINT: RGB = { r: 139, g: 92, b: 246 };

export function rgbString(c: RGB): string {
  return `${c.r},${c.g},${c.b}`;
}

export function rgba(c: RGB, alpha: number): string {
  return `rgba(${rgbString(c)},${alpha})`;
}

export function lighten(c: RGB, amount: number): RGB {
  return {
    r: Math.min(255, Math.round(c.r + (255 - c.r) * amount)),
    g: Math.min(255, Math.round(c.g + (255 - c.g) * amount)),
    b: Math.min(255, Math.round(c.b + (255 - c.b) * amount)),
  };
}

export function getDominantColor(src: string): Promise<RGB> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const size = 24;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(DEFAULT_TINT);
      try {
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const count = size * size;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        resolve({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
      } catch {
        resolve(DEFAULT_TINT);
      }
    };
    img.onerror = () => resolve(DEFAULT_TINT);
    img.src = src;
  });
}
