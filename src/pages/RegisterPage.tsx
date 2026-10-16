import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, CheckCircle } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";
import GoogleButton from "@/components/auth/GoogleButton";
import { track } from "@/lib/telemetry";

export default function RegisterPage() {
  usePageTitle("Crear cuenta | Watchly");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Definitive check: query auth.users directly via SECURITY DEFINER RPC.
    // Works for confirmed AND unconfirmed emails, regardless of GoTrue errors.
    const { data: exists, error: rpcError } = await supabase.rpc("email_exists", { email });

    if (rpcError) {
      setError(`Error al verificar email: ${rpcError.message}`);
      setLoading(false);
      return;
    }

    if (exists) {
      setError("ESTE MAIL YA EXISTE. ¿Ya tenés cuenta? Iniciá sesión.");
      setLoading(false);
      return;
    }

    // Email not registered → proceed with signUp
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/confirmar-email`,
      },
    });

    if (error) {
      setError(error.message);
    } else if (data?.user && data.user.email_confirmed_at) {
      // signUp returned an already-confirmed existing user (fallback)
      setError("ESTE MAIL YA EXISTE. ¿Ya tenés cuenta? Iniciá sesión.");
    } else {
      track("sign_up", { method: "email" });
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <AuthShell title="Revisá tu email" subtitle="Un último paso para entrar" back={from}>
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full liquid-glass-sm flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            Te enviamos un enlace de confirmación a <strong className="text-white">{email}</strong>.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <a href="/login"
              className="h-14 rounded-full bg-white text-[#111] hover:text-[#111] font-extrabold flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02]">
              Iniciar sesión
            </a>
            <a href="/" className="text-sm font-bold text-white/70 hover:text-white">Volver al inicio</a>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Creá tu cuenta"
      subtitle="Creá tu perfil de Watchly"
      back={from}
      footer={<>¿Ya tenés cuenta? <a href="/login" className="font-bold text-white hover:underline">Iniciar sesión</a></>}
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
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="auth-input !pr-14" placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
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
            <p>{error}</p>
            {error.includes("EXISTE") && (
              <a href="/login" className="font-bold underline mt-1 block text-white">Iniciar sesión</a>
            )}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="h-14 rounded-full bg-white text-[#111] font-extrabold text-base shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
      <div className="flex items-center gap-3 my-5 text-xs font-bold text-white/50"><span className="flex-1 h-px bg-white/15" />o<span className="flex-1 h-px bg-white/15" /></div>
      <GoogleButton label="Registrarme con Google" />
      <p className="text-[11px] text-center text-white/55 mt-5 leading-relaxed">
        Al crear tu cuenta aceptás los <a href="/terminos" className="underline hover:text-white">Términos</a> y la <a href="/privacidad" className="underline hover:text-white">Política de privacidad</a>.
      </p>
    </AuthShell>
  );
}
