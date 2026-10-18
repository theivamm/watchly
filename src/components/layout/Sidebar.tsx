import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Film, BookOpen, List, Map, Dna, Settings, MonitorPlay, Sparkles, Shield, LogOut, Check, X, RotateCw } from "lucide-react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { useTrending } from "@/hooks/useMedia";
import { getPosterUrl } from "@/services/tmdb";
import { useAuth } from "@/app/auth-context";
import Avatar from "@/components/ui/Avatar";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/recomendaciones", label: "Para vos", icon: Sparkles },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/salas", label: "Salas", icon: MonitorPlay, hidden: true },
  { to: "/adn", label: "Mi ADN", icon: Dna },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export default function Sidebar() {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";
  const iconBtn =
    "liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white transition-transform hover:scale-105";

  return (
    <aside
      className="hidden md:flex flex-col items-center sticky top-4 h-[calc(100vh-2rem)] shrink-0 z-40 m-4 mr-0 rounded-[2rem] py-5"
      style={{ width: 84, background: "linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.03) 45%, rgba(255,255,255,.08))", backdropFilter: "blur(28px) saturate(1.9) brightness(1.08)", WebkitBackdropFilter: "blur(28px) saturate(1.9) brightness(1.08)", border: "1px solid rgba(255,255,255,.22)", boxShadow: "inset 1.5px 0 0 rgba(255,90,140,.35), inset -1.5px 0 0 rgba(90,170,255,.35), inset 0 1px 0 rgba(255,255,255,.35), 0 20px 50px -18px rgba(0,0,0,.6)" }}
    >
      <Link to="/inicio" className="font-cinema text-4xl leading-none h-12 flex items-center text-white hover:text-white select-none" title="Watchly">
        W
      </Link>

      <nav className="flex-1 flex flex-col items-center gap-1.5 py-5 overflow-y-auto no-scrollbar">
        {navItems.filter((item) => !item.hidden).map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className="group flex flex-col items-center gap-1 w-[60px] py-2.5 rounded-[1.25rem] transition-all duration-300"
              style={{
                background: active ? "#fff" : "transparent",
                color: active ? "#111" : "rgba(255,255,255,0.78)",
                boxShadow: active ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
              }}
            >
              <Icon
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={active ? 2.4 : 2}
              />
              <span className="text-[10px] font-bold leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-3 shrink-0">
        <Link to={profileHref} title="Ver mi perfil" className="rounded-full p-[3px] bg-white/90 hover:scale-105 transition-transform">
          <Avatar profile={profile ?? null} size={40} />
        </Link>
        {isAdmin && (
          <Link to="/admin" title="Panel admin" aria-label="Panel admin" className={iconBtn}
            style={location.pathname.startsWith("/admin") ? { background: "#fff", color: "#111" } : undefined}>
            <Shield className="w-5 h-5" />
          </Link>
        )}
        <Link to="/configuracion/perfil" title="Configuración" aria-label="Configuración" className={iconBtn}>
          <Settings className="w-5 h-5" />
        </Link>
        <LogoutButton className={iconBtn} />
      </div>
    </aside>
  );
}

function LogoutButton({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} title="Cerrar sesión" aria-label="Cerrar sesión" aria-haspopup="dialog"
        className={className} style={open ? { background: "rgba(239,68,68,.25)", color: "#fca5a5" } : undefined}>
        <LogOut className="w-5 h-5" />
      </button>
      {open && createPortal(<LogoutDialog onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function LogoutDialog({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const { data } = useTrending("all");
  const posters = (data?.results ?? []).filter((i) => i.posterPath).slice(0, 5);
  const [leaving, setLeaving] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !leaving) onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose, leaving]);

  const logout = async () => {
    setLeaving(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const name = profile?.display_name || profile?.username;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5 text-white animate-fade-in"
      onClick={leaving ? undefined : onClose}
      style={{ background: "rgba(5,5,12,.62)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div role="dialog" aria-modal="true" aria-labelledby="logout-title" onClick={(e) => e.stopPropagation()}
        className="liquid-menu relative w-full max-w-sm overflow-hidden rounded-[2rem] animate-pop"
        style={{
          background: "radial-gradient(130% 90% at 0% 0%, rgba(255,50,130,.32), transparent 60%), radial-gradient(130% 90% at 100% 100%, rgba(40,190,255,.28), transparent 60%), rgba(12,10,24,.96)",
          transformOrigin: "center",
        }}>
        {/* Portadas de fondo */}
        <div aria-hidden="true" className="relative h-36 flex items-end justify-center gap-2 -mb-6 overflow-hidden"
          style={{ WebkitMaskImage: "linear-gradient(180deg, #000 30%, transparent)", maskImage: "linear-gradient(180deg, #000 30%, transparent)" }}>
          {posters.map((p, i) => (
            <img key={p.tmdbId} src={getPosterUrl(p.posterPath, "w200")} alt=""
              className="w-20 aspect-[2/3] object-cover rounded-xl border border-white/20 shadow-[0_14px_30px_rgba(0,0,0,.5)]"
              style={{ transform: `rotate(${(i - 2) * 7}deg) translateY(${Math.abs(i - 2) * 14 + 18}px)`, opacity: i === 2 ? 1 : 0.75 }} />
          ))}
        </div>

        <div className="relative px-7 pb-7 text-center">
          <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center bg-red-500/20 border border-red-400/30">
            <LogOut className="w-6 h-6 text-red-300" />
          </span>
          <h2 id="logout-title" className="font-cinema text-4xl leading-none mt-4">¿Cerrar sesión?</h2>
          <p className="text-sm text-white/75 mt-3 leading-relaxed">
            {name ? <>Te vamos a extrañar, <strong className="text-white">{name}</strong>. </> : null}
            Tu biblioteca, listas y ADN quedan guardados para cuando vuelvas.
          </p>
          <div className="flex gap-3 mt-7">
            <button type="button" onClick={onClose} disabled={leaving}
              className="liquid-glass-sm flex-1 h-12 rounded-full inline-flex items-center justify-center gap-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-50">
              <X className="w-4 h-4" /> Cancelar
            </button>
            <button ref={confirmRef} type="button" onClick={logout} disabled={leaving}
              className="flex-1 h-12 rounded-full inline-flex items-center justify-center gap-2 bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_30px_rgba(0,0,0,.4)] transition-transform hover:scale-[1.03] disabled:opacity-70">
              {leaving ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
              {leaving ? "Saliendo…" : "Sí, salir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
