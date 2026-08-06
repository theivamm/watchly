import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, User, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";

export default function UserMenu() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const initial = (profile?.display_name || user.email || "W").charAt(0).toUpperCase();
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
        className="flex items-center gap-2 h-11 pl-1 pr-3 rounded-full transition-all hover:scale-[1.03] cursor-pointer"
        style={{ backgroundColor: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-full bg-[#0b0b14] flex items-center justify-center"
          style={{ boxShadow: "0 0 14px rgba(139,92,246,0.35)" }}
        >
          <span className="text-sm font-extrabold text-gradient">{initial}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-secondary)" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-2xl border p-2 z-50"
          style={{
            backgroundColor: "var(--surface-2)",
            borderColor: "var(--border)",
            boxShadow: "0 20px 50px -12px rgba(0,0,0,0.7)",
          }}
        >
          <div className="px-3 py-2.5 mb-1 border-b" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {profile?.display_name || user.email}
            </p>
            {profile?.username && (
              <p className="text-xs truncate mt-0.5" style={{ color: "#c4b5fd" }}>@{profile.username}</p>
            )}
          </div>
          <Link
            to={profileHref}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--text-primary)" }}
          >
            <User className="w-4 h-4" />
            Ver mi perfil
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:opacity-80 cursor-pointer text-left"
            style={{ color: "#f87171" }}
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
