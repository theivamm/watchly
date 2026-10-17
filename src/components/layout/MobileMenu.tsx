import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useRandomCovers } from "@/hooks/useRandomCovers";
import { getBackdropUrl } from "@/services/tmdb";
import "@/styles/cinema.css";

export interface MenuItem { to: string; label: string; active?: boolean; primary?: boolean }

const line = { background: "#fff", boxShadow: "-2px 0 0 rgba(255,60,130,.9), 2px 0 0 rgba(60,200,255,.9)" } as const;

/** Ícono propio: dos trazos desfasados con borde cromático que se cruzan en una X. */
export function Burger({ open }: { open: boolean }) {
  return (
    <span className="relative block w-7 h-7" aria-hidden="true">
      <span className="absolute h-[3px] rounded-full transition-all duration-500" style={{ ...line, top: open ? 12 : 6, right: open ? 1 : 1, width: open ? 26 : 14, transform: open ? "rotate(45deg)" : "none" }} />
      <span className="absolute h-[3px] rounded-full transition-all duration-500" style={{ ...line, top: open ? 12 : 17, left: 1, width: open ? 26 : 26, transform: open ? "rotate(-45deg)" : "none" }} />
      <span className="absolute w-[5px] h-[5px] rounded-full transition-all duration-500" style={{ ...line, left: 1, top: 6, opacity: open ? 0 : 1 }} />
    </span>
  );
}

/** Menú móvil: botón con ícono propio + pantalla completa con color de portada y manchas cromáticas. */
export default function MobileMenu({ items, footer, buttonClass = "" }: { items: MenuItem[]; footer?: ReactNode; buttonClass?: string }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [seed, setSeed] = useState(0);
  const location = useLocation();
  const covers = useRandomCovers(6);
  const cover = covers.length ? covers[seed % covers.length] : null;

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) { setReady(false); return; }
    const raf = requestAnimationFrame(() => setReady(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open]);

  const toggle = () => { if (!open) setSeed((s) => s + 1); setOpen((v) => !v); };

  return (
    <>
      <button type="button" onClick={toggle} aria-label="Abrir menú" aria-expanded={open}
        className={`liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform active:scale-90 ${buttonClass}`}>
        <Burger open={false} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[90] overflow-hidden text-white" role="dialog" aria-modal="true" aria-label="Menú"
          style={{ background: "#07070d", opacity: ready ? 1 : 0, transition: "opacity .4s ease" }}>
          {cover && <img src={getBackdropUrl(cover.backdropPath, "w780")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-60" />}
          <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full blur-[110px] cinema-drift-a" style={{ background: "rgba(255,50,130,.55)" }} />
          <div className="absolute -bottom-40 -right-32 w-[560px] h-[560px] rounded-full blur-[120px] cinema-drift-b" style={{ background: "rgba(40,190,255,.5)" }} />
          <div className="absolute top-1/3 left-1/4 w-[360px] h-[360px] rounded-full blur-[100px] cinema-drift-b" style={{ background: "rgba(140,90,255,.4)" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.35), rgba(7,7,13,.7))", boxShadow: "inset 4px 0 0 rgba(255,80,140,.55), inset -4px 0 0 rgba(70,170,255,.55)" }} />

          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="liquid-glass absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center z-10 active:scale-90 transition-transform">
            <Burger open />
          </button>

          <div className="relative h-full overflow-y-auto no-scrollbar flex flex-col px-7 pt-24 pb-10">
            <p className="text-xs font-extrabold uppercase tracking-[.25em] text-white/70 mb-6">Menú</p>
            <nav className="flex flex-col gap-1">
              {items.map((it, i) => (
                <Link key={it.to + it.label} to={it.to} onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4 py-2 text-white hover:text-white transition-all duration-500"
                  style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(28px)", transitionDelay: `${80 + i * 55}ms` }}>
                  <span className="font-cinema text-2xl w-9 shrink-0 text-transparent" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,.5)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-cinema text-5xl leading-[1.05]" style={it.active ? { color: "#fff", borderBottom: "3px solid #fff" } : { color: "rgba(255,255,255,.72)" }}>{it.label}</span>
                  {it.primary && <span className="ml-1 self-center px-3 py-1 rounded-full bg-white text-[#111] text-[11px] font-extrabold">Gratis</span>}
                </Link>
              ))}
            </nav>
            {footer && <div className="mt-auto pt-10 transition-all duration-700" style={{ opacity: ready ? 1 : 0, transitionDelay: `${150 + items.length * 55}ms` }}>{footer}</div>}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
