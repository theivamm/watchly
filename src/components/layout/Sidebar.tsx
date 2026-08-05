import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, User } from "lucide-react";
import { useAuth } from "@/app/auth-context";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r"
      style={{
        width: 224,
        backgroundColor: "rgba(11,11,20,0.6)",
        borderColor: "rgba(139,92,246,0.15)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-5 shrink-0">
        <Link to="/inicio" className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-lg"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 14px rgba(139,92,246,0.45)" }}
          >
            W
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gradient whitespace-nowrap">Watchly</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1.5 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center rounded-2xl transition-all duration-200"
              style={{
                padding: "10px 12px",
                color: active ? "#fff" : "var(--text-secondary)",
                background: active ? "var(--gradient-accent)" : "transparent",
                boxShadow: active ? "0 4px 16px rgba(139,92,246,0.4)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 2} />
                <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Perfil */}
      <div className="px-3 pb-4 shrink-0">
        <Link
          to="/configuracion/perfil"
          className="flex items-center rounded-2xl transition-all"
          style={{
            padding: "10px 12px",
            color: "var(--text-secondary)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-3">
            <User className="w-5 h-5" />
            <span className="text-sm font-semibold whitespace-nowrap">Perfil</span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
