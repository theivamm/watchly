import "@/styles/cinema.css";
import { useRef } from "react";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";

/** Índice anterior, actualizado en el mismo render en que cambia `index`. */
export function usePrevIndex(index: number): number {
  const ref = useRef({ index, prev: index });
  if (ref.current.index !== index) ref.current = { index, prev: ref.current.index };
  return ref.current.prev;
}

interface Props {
  items: { backdropPath: string | null; posterPath: string | null }[];
  index: number;
  glow: string;
  glow2: string;
  /** Sin fondo propio: la imagen se funde con el fondo global en todos sus bordes. */
  soft?: boolean;
  /** Aberración cromática: dos copias desplazadas en rojo y cian. */
  chroma?: boolean;
}

/** Fondo cinematográfico: imagen grande con crossfade + manchas de color en movimiento. */
export default function HeroBackdrop({ items, index, glow, glow2, soft = false, chroma = false }: Props) {
  // Solo la capa activa, la saliente y la siguiente se dibujan. La saliente se calcula en el
  // mismo render (no en un efecto): si llega un render tarde, se oculta un cuadro y la página parpadea.
  const prev = usePrevIndex(index);

  const mask = soft
    ? "linear-gradient(90deg, transparent 0, #000 34%), linear-gradient(180deg, transparent 0, #000 14%, #000 58%, transparent 100%)"
    : "linear-gradient(90deg, transparent 0, #000 38%)";
  return (
    <div className={`absolute inset-0 ${soft ? "" : "bg-[#07070d]"}`} aria-hidden="true">
      {!soft && (
        <>
          <div className="hidden md:block absolute -top-52 -left-32 w-[760px] h-[760px] rounded-full blur-[120px] cinema-drift-a transition-colors duration-[1600ms]" style={{ background: glow }} />
          <div className="hidden md:block absolute -bottom-64 right-[20%] w-[820px] h-[820px] rounded-full blur-[140px] cinema-drift-b transition-colors duration-[1600ms]" style={{ background: glow2 }} />
        </>
      )}

      {items.map((it, i) => {
        const hasBackdrop = !!it.backdropPath;
        const live = i === index || i === prev;
        const upcoming = items.length > 1 && i === (index + 1) % items.length;
        return (
          <div
            key={`${it.backdropPath ?? it.posterPath}-${i}`}
            className="absolute top-0 right-0 h-full w-full lg:w-[74%] transition-opacity duration-[1800ms] ease-in-out"
            style={{
              opacity: i === index ? 1 : 0,
              visibility: live || upcoming ? "visible" : "hidden",
              willChange: live || upcoming ? "opacity" : undefined,
              transform: "translateZ(0)",
              backfaceVisibility: "hidden",
              WebkitMaskImage: mask,
              maskImage: mask,
              WebkitMaskComposite: soft ? "source-in" : undefined,
              maskComposite: soft ? "intersect" : undefined,
            }}
          >
            {chroma && live && hasBackdrop && [-1, 1].map((d) => (
              <div key={d} className="hidden md:block absolute inset-0" style={{ transform: `translateX(${d * 9}px)`, mixBlendMode: "screen", opacity: 0.45, filter: d < 0 ? "sepia(1) saturate(6) hue-rotate(-50deg)" : "sepia(1) saturate(6) hue-rotate(150deg)" }}>
                <img src={getBackdropUrl(it.backdropPath, "w780")} alt="" decoding="async" className="w-full h-full object-cover" />
              </div>
            ))}
            <img
              src={hasBackdrop ? getBackdropUrl(it.backdropPath) : getPosterUrl(it.posterPath, "w500")}
              srcSet={hasBackdrop ? `${getBackdropUrl(it.backdropPath, "w780")} 780w, ${getBackdropUrl(it.backdropPath)} 1280w` : undefined}
              sizes="100vw"
              alt=""
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover ${live ? "cinema-kenburns" : ""}`}
              style={hasBackdrop ? { backfaceVisibility: "hidden" } : { filter: "blur(28px) saturate(1.2)", transform: "scale(1.3)" }}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 lg:hidden" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.5), rgba(7,7,13,.82))" }} />
      <div className="absolute inset-0"
        style={{ ...(soft ? { WebkitMaskImage: "linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%)", maskImage: "linear-gradient(180deg, transparent 0, #000 22%, #000 70%, transparent 100%)" } : {}), background: soft
          ? "linear-gradient(90deg, rgba(7,7,13,.7) 0%, rgba(7,7,13,.2) 45%, transparent 70%)"
          : "linear-gradient(90deg, rgba(7,7,13,.82) 0%, rgba(7,7,13,.3) 48%, transparent 72%), linear-gradient(180deg, rgba(7,7,13,.45) 0, transparent 22%, transparent 60%, #07070d 100%)" }} />
    </div>
  );
}
