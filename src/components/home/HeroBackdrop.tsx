import "@/styles/cinema.css";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";

interface Props {
  items: { backdropPath: string | null; posterPath: string | null }[];
  index: number;
  glow: string;
  glow2: string;
  soft?: boolean;
  chroma?: boolean;
}

/** A static image with gradient overlays; no animated filters or composite masks. */
export default function HeroBackdrop({ items, index, soft = false }: Props) {
  const active = items[index];
  const next = items.length > 1 ? (index + 1) % items.length : index;
  return <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {items.map((item, i) => (i === index || i === next) && <img
      key={`${item.backdropPath ?? item.posterPath}-${i}`}
      src={item.backdropPath ? getBackdropUrl(item.backdropPath, "w780") : getPosterUrl(item.posterPath, "w500")}
      alt="" decoding="async"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity: i === index ? 1 : 0 }}
    />)}
    {!active && <div className="absolute inset-0 bg-[#10101c]" />}
    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(7,7,13,.88), rgba(7,7,13,.25)), linear-gradient(0deg, #07070d, transparent 65%)" }} />
    {soft && <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.45), transparent 35%)" }} />}
  </div>;
}
