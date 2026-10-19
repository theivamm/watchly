
import { getPosterUrl } from "@/services/tmdb";

interface PosterFrameProps {
  src: string;
  alt: string;
  rounded?: string;
  border?: string;
  className?: string;
  children?: React.ReactNode;
}

/** Single-layer poster: avoid multiplying filtered images in every carousel. */
export default function PosterFrame({ src, alt, rounded = "rounded-[1.6rem]", border = "border-white/20", className = "", children }: PosterFrameProps) {
  return (
    <div className={`relative aspect-[2/3] transition-transform duration-500 group-hover:-translate-y-2 ${className}`}>
      <div className={`relative w-full h-full ${rounded} overflow-hidden border ${border} shadow-[0_22px_44px_-18px_rgba(0,0,0,.8)] bg-[#0c0a18]`}>
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {children}
      </div>
    </div>
  );
}

export const posterSrc = (path: string | null, size: "w200" | "w342" | "w500" = "w342") => getPosterUrl(path, size);
