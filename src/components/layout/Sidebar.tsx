import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, Map } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import UserMenu from "./UserMenu";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r z-40"
      style={{
        width: 84,
        backgroundColor: "rgba(11,11,20,0.6)",
        borderColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
      }}
    >
      {/* Logo: solo la W */}
      <div className="flex items-center justify-center h-20 shrink-0">
        <span
          className="text-4xl font-extrabold tracking-tight text-gradient select-none"
          style={{ textShadow: "0 0 30px color-mix(in srgb, var(--accent) 45%, transparent)" }}
        >
          W
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1.5 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              title={label}
              className="group flex flex-col items-center gap-1 rounded-2xl transition-all duration-300"
              style={{
                padding: "10px 0",
                color: active ? "var(--accent-light)" : "var(--text-secondary)",
              }}
            >
              <Icon
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className="text-[10px] font-semibold leading-none transition-colors duration-300 group-hover:text-[var(--accent-light)]"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Avatar + dropdown */}
      <div className="px-3 pb-5 shrink-0">
        <UserMenu compact />
      </div>
    </aside>
  );
}
