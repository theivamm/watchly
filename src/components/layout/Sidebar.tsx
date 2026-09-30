import "@/styles/cinema.css";
import { Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, Map, Dna, Settings, User, MonitorPlay } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import Avatar from "@/components/ui/Avatar";

const navItems = [
  { to: "/inicio", label: "Inicio", icon: Film },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { to: "/listas", label: "Listas", icon: List },
  { to: "/salas", label: "Salas", icon: MonitorPlay, hidden: true },
  { to: "/adn", label: "Mi ADN", icon: Dna },
  { to: "/roadmap", label: "Roadmap", icon: Map },
];

export default function Sidebar() {
  const { user, profile } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";
  const iconBtn =
    "liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white transition-transform hover:scale-105";

  return (
    <aside
      className="liquid-glass hidden md:flex flex-col items-center sticky top-4 h-[calc(100vh-2rem)] shrink-0 z-40 m-4 mr-0 rounded-[2rem] py-5"
      style={{ width: 84 }}
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
        <Link to="/configuracion/perfil" title="Configuración" aria-label="Configuración" className={iconBtn}>
          <Settings className="w-5 h-5" />
        </Link>
        <Link to={profileHref} title="Ver mi perfil" aria-label="Ver mi perfil" className={iconBtn}>
          <User className="w-5 h-5" />
        </Link>
      </div>
    </aside>
  );
}
