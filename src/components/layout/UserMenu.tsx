import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left?: number; right?: number }>({});

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      setPos(compact
        ? { left: Math.max(8, r.left), bottom: window.innerHeight - r.top + 8 }
        : { top: r.bottom + 12, right: Math.max(8, document.documentElement.clientWidth - r.right) });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, compact]);

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

      {open && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", ...pos }}
          className="liquid-menu w-72 rounded-[2rem] p-2 z-[80] text-white"
        >
          <div className="liquid-menu-head">
            <Avatar profile={profile ?? null} size={44} />
            <div className="min-w-0">
              <p className="text-sm font-extrabold truncate text-white">{profile?.display_name || user.email}</p>
              {profile?.username && <p className="text-xs truncate mt-0.5 text-white/70">@{profile.username}</p>}
            </div>
          </div>
          <Link to={profileHref} onClick={() => setOpen(false)} className="liquid-menu-item text-white hover:text-white">
            <User className="w-4 h-4" /> Ver mi perfil
          </Link>
          <Link to="/inicio" onClick={() => setOpen(false)} className="liquid-menu-item text-white hover:text-white">
            <LayoutDashboard className="w-4 h-4" /> Ir al inicio
          </Link>
          <div className="liquid-menu-sep" />
          <button onClick={handleLogout} className="liquid-menu-item is-danger">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
