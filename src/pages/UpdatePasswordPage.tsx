import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Lock } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function UpdatePasswordPage() {
  usePageTitle("Actualizar contraseña | Watchly");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/inicio";
      }, 2000);
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Nueva contraseña" subtitle="Ingresá tu nueva contraseña">
      {success ? (
        <p className="text-center py-4 font-bold">Contraseña actualizada. Redirigiendo...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">Nueva contraseña</span>
            <span className="relative block">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/60" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                className="auth-input" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
            </span>
          </label>

          {error && (
            <div className="px-4 py-3 rounded-2xl text-sm font-semibold border border-red-400/30 bg-red-500/15 text-red-200">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="h-14 rounded-full bg-white text-[#111] font-extrabold text-base shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
