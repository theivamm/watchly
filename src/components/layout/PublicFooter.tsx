import { usePrevIndex } from "@/components/home/HeroBackdrop";
import { getBackdropUrl, getPosterUrl } from "@/services/tmdb";

const TICKER = ["Viví tu cine", "Compartí lo que ves", "Tu ADN audiovisual", "¿Qué vemos hoy?", "Tu historial, tuyo"];

const COLUMNS = [
  { h: "Producto", l: [["Roadmap", "/roadmap"], ["Iniciar sesión", "/login"], ["Crear cuenta", "/registro"]] },
  { h: "Legal", l: [["Privacidad", "/privacidad"], ["Términos", "/terminos"]] },
  { h: "Explorar", l: [["Tendencia", "/tendencias"], ["ADN Audiovisual", "/adn"], ["¿Qué vemos hoy?", "/que-vemos-hoy"]] },
];

type Item = { tmdbId: number; backdropPath: string | null; posterPath: string | null };

const imgOf = (it: Item) => (it.backdropPath ? getBackdropUrl(it.backdropPath, "w1280") : getPosterUrl(it.posterPath, "w500"));

/** Pie de las páginas públicas: sigue el mismo ciclo de imágenes que el hero de cada página. */
export default function PublicFooter({ items, index }: { items: Item[]; index: number }) {
  const footPrev = usePrevIndex(index);
  return (
    <footer className="relative overflow-hidden border-t border-white/20">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {items.map((it, i) => (
          <div key={it.tmdbId} className="absolute left-1/2 bottom-0 w-[90vw] h-[90vw] max-w-[1500px] max-h-[1500px] -translate-x-1/2 translate-y-[45%] rounded-full blur-[130px] transition-opacity duration-[1800ms]"
            style={{ opacity: i === index ? 0.55 : 0, visibility: i === index || i === footPrev ? "visible" : "hidden", backgroundImage: `url(${imgOf(it)})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ))}
      </div>
      <div className="relative flex overflow-hidden border-b border-white/15 py-4 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]" aria-hidden="true">
        <div className="flex shrink-0 animate-marquee items-center">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="font-cinema text-2xl md:text-3xl whitespace-nowrap text-white/70 px-8 flex items-center gap-8">{t}<span className="w-2 h-2 rounded-full bg-white/50" /></span>
          ))}
        </div>
      </div>

      <div className="relative px-5 md:px-10 lg:px-16 pt-14 grid gap-12 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <p className="font-cinema text-4xl leading-none">Tu identidad audiovisual.</p>
          <p className="text-sm text-white/70 mt-4 max-w-xs">Guardá lo que ves, entendé lo que te gusta y decidí qué ver hoy.</p>
          <a href="/registro" className="mt-6 inline-flex h-12 px-6 items-center rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold transition-transform hover:scale-[1.04]">Crear cuenta →</a>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.h}>
            <p className="text-xs font-extrabold tracking-[.25em] uppercase text-white/60 mb-4">{c.h}</p>
            <ul className="space-y-2.5">{c.l.map(([t, href]) => <li key={t}><a href={href} className="text-base font-bold text-white/85 hover:text-white">{t}</a></li>)}</ul>
          </div>
        ))}
      </div>

      <div className="relative mt-10 px-2 select-none grid" aria-hidden="true">
        {(items.length ? items : [null]).map((it, i) => (
          <p key={it ? it.tmdbId : "none"} className="[grid-area:1/1] font-cinema text-center whitespace-nowrap text-[26vw] md:text-[24vw] leading-none pt-[0.08em] pb-[0.02em] -mb-[3vw] transition-opacity duration-[1800ms]"
            style={it ? { opacity: i === index ? 1 : 0, visibility: i === index || i === footPrev ? "visible" : "hidden", backgroundImage: `url(${imgOf(it)})`, backgroundSize: "cover", backgroundPosition: "center", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", WebkitTextStroke: "2px rgba(255,255,255,.5)" } : { color: "rgba(255,255,255,.15)" }}>
            WATCHLY
          </p>
        ))}
      </div>
      <div className="relative z-10 px-5 md:px-10 lg:px-16 py-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-white/60 border-t border-white/15 bg-black/30 backdrop-blur-md">
        <span>© {new Date().getFullYear()} Watchly</span>
        <span>Hecho para quienes viven el cine.</span>
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="hover:text-white">Volver arriba ↑</a>
      </div>
    </footer>
  );
}
