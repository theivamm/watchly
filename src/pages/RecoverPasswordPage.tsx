import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function RecoverPasswordPage() {
  usePageTitle("Recuperar contraseña | Watchly");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <AuthShell title="Revisá tu email" subtitle="Te enviamos un enlace para recuperar tu contraseña.">
        <a href="/login"
          className="h-14 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02]">
          Volver al login
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle="Ingresá tu email y te enviaremos un enlace"
      footer={<a href="/login" className="font-bold text-white hover:underline">Volver al login</a>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">Email</span>
          <span className="relative block">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/60" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="auth-input" placeholder="tu@email.com" autoComplete="email" />
          </span>
        </label>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm font-semibold border border-red-400/30 bg-red-500/15 text-red-200">{error}</div>
        )}

        <button type="submit" disabled={loading}
          className="h-14 rounded-full bg-white text-[#111] font-extrabold text-base shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthShell>
  );
}
