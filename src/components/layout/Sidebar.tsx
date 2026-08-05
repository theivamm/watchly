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
      {/* Logo: solo la W */}
      <div className="flex items-center justify-center h-20 shrink-0">
        <span
          className="text-4xl font-extrabold tracking-tight text-gradient select-none"
          style={{ textShadow: "0 0 30px rgba(139,92,246,0.45)" }}
        >
          W
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-2 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="group relative flex items-center rounded-2xl transition-all duration-300 overflow-hidden"
              style={{
                padding: "11px 14px",
                color: active ? "#fff" : "var(--text-secondary)",
                background: active ? "var(--gradient-accent)" : "transparent",
                boxShadow: active ? "0 8px 24px rgba(139,92,246,0.55)" : "none",
              }}
            >
              {/* Hover gradient base */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: active ? "none" : "var(--gradient-accent-soft)" }}
              />

              {/* Shine sweep */}
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
              />

              {/* Active left bar */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-full transition-all duration-300 ${
                  active ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 group-hover:opacity-70 group-hover:scale-y-75"
                }`}
                style={{ background: active ? "#fff" : "var(--accent)", boxShadow: "0 0 12px rgba(255,255,255,0.6)" }}
              />

              <div className="relative flex items-center gap-3">
                <Icon
                  className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  strokeWidth={active ? 2.4 : 2}
                />
                <span className="text-sm font-semibold whitespace-nowrap transition-transform duration-300 group-hover:translate-x-0.5">
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Perfil */}
      <div className="px-3 pb-5 shrink-0">
        <Link
          to="/configuracion/perfil"
          className="group relative flex items-center rounded-2xl transition-all duration-300 overflow-hidden"
          style={{
            padding: "11px 14px",
            color: "var(--text-secondary)",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "var(--gradient-accent-soft)" }}
          />
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
          />
          <div className="relative flex items-center gap-3">
            <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]" />
            <span className="text-sm font-semibold whitespace-nowrap transition-transform duration-300 group-hover:translate-x-0.5">
              Perfil
            </span>
          </div>
        </Link>
      </div>
    </aside>
  );
}
