import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";
import GoogleButton from "@/components/auth/GoogleButton";
import { track } from "@/lib/telemetry";

export default function LoginPage() {
  usePageTitle("Iniciar sesión | Watchly");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      track("login_failed", { code: error.code ?? null });
      setError(
        error.code === "invalid_credentials" ? "Email o contraseña incorrectos. Si creaste tu cuenta con Google, usá Continuar con Google."
        : error.code === "email_not_confirmed" ? "Todavía no confirmaste tu email. Revisá tu bandeja de entrada."
        : error.status === 0 || /fetch/i.test(error.message) ? "No pudimos conectar. Revisá tu conexión e intentá de nuevo."
        : "No pudimos iniciar sesión. Intentá de nuevo."
      );
    } else {
      track("login", { method: "email" });
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Accedé a tu biblioteca"
      back={from}
      footer={<>¿No tenés cuenta? <a href="/registro" className="font-bold text-white hover:underline">Registrate</a></>}
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

        <label className="flex flex-col gap-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-white/70">Contraseña</span>
          <span className="relative block">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/60" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="auth-input !pr-14" placeholder="••••••••" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
                {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
          </span>
        </label>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm font-semibold border border-red-400/30 bg-red-500/15 text-red-200">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="h-14 rounded-full bg-white text-[#111] font-extrabold text-base shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <a href="/recuperar-password" className="text-center text-sm font-bold text-white/80 hover:text-white">
          ¿Olvidaste tu contraseña?
        </a>
      </form>
      <div className="flex items-center gap-3 my-5 text-xs font-bold text-white/50"><span className="flex-1 h-px bg-white/15" />o<span className="flex-1 h-px bg-white/15" /></div>
      <GoogleButton />
    </AuthShell>
  );
}
