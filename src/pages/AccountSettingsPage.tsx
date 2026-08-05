import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";

export default function AccountSettingsPage() {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Cuenta
      </h1>

      <div className="space-y-6">
        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Email</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{user?.email}</p>
        </div>

        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Cerrar sesión</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Cerrá la sesión en este dispositivo.
          </p>
          <button
            onClick={handleLogout}
            className="w-full px-5 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1.5px solid rgba(239,68,68,0.25)", boxShadow: "0 2px 10px rgba(239,68,68,0.1)" }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
