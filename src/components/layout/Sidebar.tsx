import { useNavigate, Link, useLocation } from "react-router-dom";
import { Search, Film, BookOpen, List, User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <aside
      className="hidden md:flex flex-col sticky top-0 h-screen shrink-0 border-r"
      style={{
        width: 84,
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
                color: active ? "#c4b5fd" : "var(--text-secondary)",
              }}
            >
              <Icon
                className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className="text-[10px] font-semibold leading-none transition-colors duration-300 group-hover:text-[#c4b5fd]"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil + logout */}
      <div className="px-3 pb-5 shrink-0 space-y-1.5">
        <Link
          to="/configuracion/perfil"
          title="Perfil"
          className="group relative flex flex-col items-center gap-1 rounded-2xl transition-all duration-300 overflow-hidden"
          style={{
            padding: "10px 0",
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
          <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          <span className="text-[10px] font-semibold leading-none">Perfil</span>
        </Link>

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="group relative w-full flex flex-col items-center gap-1 rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer"
          style={{
            padding: "10px 0",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "rgba(248,113,113,0.12)" }}
          />
          <span
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
            style={{ background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.18), transparent)" }}
          />
          <LogOut className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-12 group-hover:text-[#f87171]" />
          <span className="text-[10px] font-semibold leading-none transition-colors group-hover:text-[#fca5a5]">Salir</span>
        </button>
      </div>
    </aside>
  );
}
