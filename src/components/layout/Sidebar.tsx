import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, Map, Dna, Settings, User, MonitorPlay } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import Avatar from "@/components/ui/Avatar";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/salas", label: "Salas", icon: MonitorPlay },
  { to: "/adn", label: "Mi ADN", icon: Dna },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export default function Sidebar() {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";
  const iconBtn =
    "w-11 h-11 rounded-2xl flex items-center justify-center text-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)] focus:ring-offset-2 focus:ring-offset-[#0b0b14]";

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

      {/* Avatar + icon strip (sin dropdown) */}
      <div className="px-3 pb-5 shrink-0 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          <Avatar profile={profile ?? null} size={36} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <Link to="/configuracion/perfil" title="Configuración" aria-label="Configuración"
            className={iconBtn}
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <Settings className="w-5 h-5" />
          </Link>
          <Link to={profileHref} title="Ver mi perfil" aria-label="Ver mi perfil"
            className={iconBtn}
            style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
