
import { getPosterUrl } from "@/services/tmdb";

interface PosterFrameProps {
  src: string;
  alt: string;
  rounded?: string;
  border?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Póster con el efecto de hover de toda la app: sube, se enciende un brillo con el color del póster
 * y aparece la aberración cromática rosa/cian en los bordes. Reacciona al `group` del contenedor padre.
 */
export default function PosterFrame({ src, alt, rounded = "rounded-[1.6rem]", border = "border-white/20", className = "", children }: PosterFrameProps) {
  return (
    <div className={`relative aspect-[2/3] transition-transform duration-500 group-hover:-translate-y-2 ${className}`}>
      <img src={src} alt="" aria-hidden="true" loading="lazy"
        className={`absolute inset-0 w-full h-full object-cover ${rounded} blur-2xl scale-95 translate-y-3 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none`} />
      {[-1, 1].map((d) => (
        <img key={d} src={src} alt="" aria-hidden="true" loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover ${rounded} opacity-0 group-hover:opacity-55 transition-opacity duration-500 pointer-events-none`}
          style={{ transform: `translateX(${d * 5}px)`, mixBlendMode: "screen", filter: d < 0 ? "sepia(1) saturate(6) hue-rotate(-50deg)" : "sepia(1) saturate(6) hue-rotate(150deg)" }} />
      ))}
      <div className={`relative w-full h-full ${rounded} overflow-hidden border ${border} shadow-[0_22px_44px_-18px_rgba(0,0,0,.8)] bg-[#0c0a18]`}>
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {children}
      </div>
    </div>
  );
}

export const posterSrc = (path: string | null, size: "w200" | "w342" | "w500" = "w342") => getPosterUrl(path, size);
