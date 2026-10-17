import { useLocation, Link } from "react-router-dom";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { supabase } from "@/lib/supabase";
import MobileMenu, { type MenuItem } from "./MobileMenu";
import Avatar from "@/components/ui/Avatar";
import "@/styles/cinema.css";

export default function MobileNavigation() {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";
  const on = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);
  const items: MenuItem[] = [
    { to: "/inicio", label: "Inicio" },
    { to: "/recomendaciones", label: "Para vos" },
    { to: "/que-vemos-hoy", label: "¿Qué vemos hoy?" },
    { to: "/buscar", label: "Buscar" },
    { to: "/biblioteca", label: "Biblioteca" },
    { to: "/listas", label: "Listas" },
    { to: "/adn", label: "Mi ADN" },
    { to: "/roadmap", label: "Roadmap" },
    { to: profileHref, label: "Mi perfil" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ].map((i) => ({ ...i, active: on(i.to) }));

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  return (
    <div className="md:hidden fixed top-3 right-3 z-50" style={{ marginTop: "env(safe-area-inset-top, 0px)" }}>
      <MobileMenu items={items} footer={
        <div className="flex items-center gap-4">
          <Avatar profile={profile ?? null} size={48} />
          <div className="min-w-0 flex-1"><p className="font-extrabold truncate">{profile?.display_name || user.email?.split("@")[0]}</p><p className="text-xs text-white/70 truncate">@{profile?.username || "..."}</p></div>
          <Link to="/configuracion/perfil" aria-label="Configuración" className="liquid-glass-sm w-12 h-12 rounded-full flex items-center justify-center text-white hover:text-white"><Settings className="w-5 h-5" /></Link>
          <button type="button" onClick={logout} aria-label="Cerrar sesión" className="liquid-glass-sm w-12 h-12 rounded-full flex items-center justify-center text-white"><LogOut className="w-5 h-5" /></button>
        </div>
      } />
    </div>
  );
}
