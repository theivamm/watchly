import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, Map, User, Dna, ChevronUp, Settings, MonitorPlay } from "lucide-react";
import { useAuth } from "@/app/auth-context";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/salas", label: "Salas", icon: MonitorPlay, hidden: true },
  { to: "/adn", label: "Mi ADN", icon: Dna },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/perfil", label: "Perfil", icon: User },
];

export default function MobileNavigation() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";

  const itemHref = (to: string) => (to === "/perfil" ? profileHref : to);
  const itemActive = (to: string) =>
    to === "/perfil"
      ? location.pathname.startsWith("/perfil")
      : location.pathname.startsWith(to);

  const visibleItems = navItems.filter((item) => !item.hidden);

  const activeItem =
    visibleItems.find(({ to }) => itemActive(to)) ??
    visibleItems.find(({ to }) => to === "/perfil") ??
    visibleItems[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div
      ref={ref}
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex flex-col items-center pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Dropdown upward: app-style menu */}
      {open && (
        <div
          className="pointer-events-auto mb-3 w-72 rounded-3xl p-4 animate-slide-up"
          style={{
            backgroundColor: "rgba(15,15,26,0.95)",
            border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Menú
            </p>
            <Link
              to="/configuracion/perfil"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-transform active:scale-95"
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "var(--text-primary)",
              }}
            >
              <Settings className="w-3 h-3" />
              Configuración
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {visibleItems.map(({ to, label, icon: Icon }) => {
              const active = itemActive(to);
              return (
                <Link
                  key={to}
                  to={itemHref(to)}
                  className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform"
                >
                  <span
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: active ? "var(--gradient-accent)" : "rgba(255,255,255,0.08)",
                      border: `1px solid ${active ? "transparent" : "rgba(255,255,255,0.1)"}`,
                      boxShadow: active
                        ? "0 6px 18px color-mix(in srgb, var(--accent) 45%, transparent)"
                        : "none",
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={active ? 2.4 : 2}
                      style={{ color: active ? "#fff" : "var(--text-primary)" }}
                    />
                  </span>
                  <span
                    className="text-[10px] font-bold truncate w-full text-center"
                    style={{ color: active ? "var(--accent-light)" : "var(--text-secondary)" }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* App switcher pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="pointer-events-auto mb-3 flex items-center gap-2.5 pl-3 pr-3.5 py-2 rounded-full transition-transform active:scale-95"
        style={{
          backgroundColor: "rgba(11,11,20,0.9)",
          border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
        }}
      >
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--gradient-accent)",
            boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 50%, transparent)",
          }}
        >
          <ActiveIcon className="w-4 h-4" strokeWidth={2.4} style={{ color: "#fff" }} />
        </span>
        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
          {activeItem.label}
        </span>
        <ChevronUp
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-secondary)" }}
        />
      </button>
    </div>
  );
}
