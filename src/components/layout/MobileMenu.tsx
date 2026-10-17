import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { ChevronUp, LayoutGrid, type LucideIcon } from "lucide-react";
import "@/styles/cinema.css";

export interface MenuItem { to: string; label: string; icon: LucideIcon; active?: boolean; primary?: boolean }

/** Cajón de aplicaciones: botón + hoja inferior con cuadrícula de íconos y borde cromático. */
export default function MobileMenu({ items, footer, variant = "dock", buttonClass = "" }: { items: MenuItem[]; footer?: ReactNode; variant?: "dock" | "button"; buttonClass?: string }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const location = useLocation();
  const current = items.find((i) => i.active) ?? items[0];
  const CurrentIcon = current.icon;

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

  return (
    <>
      {variant === "dock" ? (
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir aplicaciones" aria-expanded={open}
          className={`liquid-glass flex items-center gap-3 pl-2.5 pr-4 h-14 rounded-full text-white active:scale-95 transition-transform ${buttonClass}`}>
          <span className="w-10 h-10 rounded-full bg-white text-[#111] flex items-center justify-center"><CurrentIcon className="w-5 h-5" strokeWidth={2.4} /></span>
          <span className="text-sm font-extrabold">{current.label}</span>
          <ChevronUp className="w-4 h-4 text-white/70" />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" aria-expanded={open}
          className={`liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform ${buttonClass}`}>
          <LayoutGrid className="w-5 h-5" />
        </button>
      )}

      {open && createPortal(
        <div className="fixed inset-0 z-[90] text-white" role="dialog" aria-modal="true" aria-label="Aplicaciones">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" style={{ opacity: ready ? 1 : 0 }} onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[78vh] overflow-hidden rounded-t-[2rem] border border-b-0 border-white/30 transition-transform duration-500"
            style={{ transform: ready ? "none" : "translateY(100%)", transitionTimingFunction: "cubic-bezier(.2,.9,.25,1)", background: "rgba(12,10,24,.94)", boxShadow: "inset 3px 0 0 rgba(255,80,140,.5), inset -3px 0 0 rgba(70,170,255,.5), inset 0 1px 0 rgba(255,255,255,.4), 0 -30px 80px -20px rgba(0,0,0,.8)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="absolute -top-20 -left-16 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ background: "rgba(255,50,130,.35)" }} />
            <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full blur-[90px] pointer-events-none" style={{ background: "rgba(40,190,255,.32)" }} />
            <div className="relative px-5 pt-3 pb-6 overflow-y-auto max-h-[78vh] no-scrollbar">
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="block mx-auto w-12 h-1.5 rounded-full bg-white/40 mb-5" />
              <div className="grid grid-cols-4 gap-x-2 gap-y-5">
                {items.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Link key={it.to + it.label} to={it.to} onClick={() => setOpen(false)} className="flex flex-col items-center gap-2 text-white hover:text-white active:scale-90 transition-transform">
                      <span className="w-14 h-14 rounded-[1.1rem] flex items-center justify-center border"
                        style={it.active ? { background: "#fff", color: "#111", borderColor: "#fff" } : it.primary ? { background: "linear-gradient(135deg, rgba(255,90,150,.7), rgba(90,190,255,.7))", borderColor: "rgba(255,255,255,.5)" } : { background: "rgba(255,255,255,.08)", borderColor: "rgba(255,255,255,.22)", boxShadow: "inset 1.5px 0 0 rgba(255,80,140,.35), inset -1.5px 0 0 rgba(70,170,255,.35)" }}>
                        <Icon className="w-6 h-6" strokeWidth={it.active ? 2.4 : 2} />
                      </span>
                      <span className="text-[11px] font-extrabold text-center leading-tight" style={{ color: it.active ? "#fff" : "rgba(255,255,255,.78)" }}>{it.label}</span>
                    </Link>
                  );
                })}
              </div>
              {footer && <div className="mt-7 pt-5 border-t border-white/15">{footer}</div>}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
