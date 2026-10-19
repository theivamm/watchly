import { useLocation, Link } from "react-router-dom";
import { Settings, LogOut, Film, Sparkles, Shuffle, BookOpen, List, Dna, Map, User, Shield } from "lucide-react";
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
  const base: Omit<MenuItem, "active">[] = [
    { to: "/inicio", label: "Inicio", icon: Film },
    { to: "/recomendaciones", label: "Para vos", icon: Sparkles },
    { to: "/que-vemos-hoy", label: "Qué vemos", icon: Shuffle },
    { to: "/biblioteca", label: "Biblioteca", icon: BookOpen },
    { to: "/listas", label: "Listas", icon: List },
    { to: "/adn", label: "Mi ADN", icon: Dna },
    { to: "/roadmap", label: "Roadmap", icon: Map },
    { to: profileHref, label: "Perfil", icon: User },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];
  const items: MenuItem[] = base.map((i) => ({ ...i, active: on(i.to) }));

  const logout = async () => { await supabase.auth.signOut(); window.location.href = "/"; };

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-50 flex justify-center pointer-events-none" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="pointer-events-auto">
        <MobileMenu items={items} footer={
          <div className="flex items-center gap-3">
            <Avatar profile={profile ?? null} size={44} />
            <div className="min-w-0 flex-1"><p className="font-extrabold truncate">{profile?.display_name || user.email?.split("@")[0]}</p><p className="text-xs text-white/70 truncate">@{profile?.username || "..."}</p></div>
            <Link to="/configuracion/perfil" aria-label="Configuración" className="liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white hover:text-white"><Settings className="w-5 h-5" /></Link>
            <button type="button" onClick={logout} aria-label="Cerrar sesión" className="liquid-glass-sm w-11 h-11 rounded-full flex items-center justify-center text-white"><LogOut className="w-5 h-5" /></button>
          </div>
        } />
      </div>
    </div>
  );
}
