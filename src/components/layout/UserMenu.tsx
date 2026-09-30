import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, User, LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";
import Avatar from "@/components/ui/Avatar";

export default function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!user) return null;

  const profileHref = profile?.username ? `/perfil/${profile.username}` : "/configuracion/perfil";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Tu cuenta"
        aria-expanded={open}
        className={compact
          ? "flex items-center justify-center h-11 w-full cursor-pointer transition-transform hover:scale-105"
          : "liquid-glass-sm flex items-center gap-2 h-11 pl-1 pr-3 rounded-full transition-all hover:scale-[1.03] cursor-pointer"}
      >
        <Avatar profile={profile ?? null} size={36} />
        {!compact && (
          <ChevronDown className={`w-4 h-4 text-white/80 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div
          className={`liquid-menu absolute w-64 rounded-[1.75rem] p-2 z-50 animate-slide-up ${compact ? "left-0 bottom-full mb-2" : "right-0 top-full mt-3"}`}
        >
          <div className="px-3.5 py-3 mb-1 border-b border-white/10">
            <p className="text-sm font-extrabold truncate text-white">
              {profile?.display_name || user.email}
            </p>
            {profile?.username && (
              <p className="text-xs truncate mt-0.5 text-white/60">@{profile.username}</p>
            )}
          </div>
          <Link to={profileHref} onClick={() => setOpen(false)} className="liquid-menu-item text-white hover:text-white">
            <User className="w-4 h-4" /> Ver mi perfil
          </Link>
          <Link to="/inicio" onClick={() => setOpen(false)} className="liquid-menu-item text-white hover:text-white">
            <LayoutDashboard className="w-4 h-4" /> Ir al inicio
          </Link>
          <button onClick={handleLogout} className="liquid-menu-item" style={{ color: "#fca5a5" }}>
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
