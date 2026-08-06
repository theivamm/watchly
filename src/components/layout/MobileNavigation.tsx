import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, Map, User } from "lucide-react";
import { useAuth } from "@/app/auth-context";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/configuracion/perfil", label: "Perfil", icon: User },
];

export default function MobileNavigation() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
      style={{
        backgroundColor: "rgba(11,11,20,0.9)",
        borderTop: "1px solid rgba(139,92,246,0.25)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
      {navItems.map(({ to, label, icon: Icon }) => {
        const active = location.pathname.startsWith(to);
        return (
          <Link key={to} to={to}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-semibold tracking-wide transition-colors"
            style={{ color: active ? "#c4b5fd" : "var(--text-secondary)" }}>
            <span className={`flex items-center justify-center rounded-full px-3 py-1 transition-all ${active ? "" : ""}`}
              style={{
                backgroundColor: active ? "var(--accent-soft)" : "transparent",
                boxShadow: active ? "0 0 16px rgba(139,92,246,0.4)" : "none",
              }}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
