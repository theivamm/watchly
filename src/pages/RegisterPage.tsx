import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ backgroundColor: "transparent" }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "var(--accent-soft)" }}>
            <CheckCircle className="w-8 h-8" style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>Revisá tu email</h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Te enviamos un enlace de confirmación a <strong>{email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 relative overflow-hidden" style={{ backgroundColor: "transparent" }}>
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }} />
      <div className="relative w-full max-w-[420px]">
        <div className="text-center mb-10">
          <a href="/" className="inline-block text-3xl font-extrabold tracking-tight mb-4 text-gradient">Watchly</a>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Creá tu cuenta</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Creá tu perfil de Watchly</p>
        </div>

        <div className="glass p-8 rounded-[1.75rem]" style={{ boxShadow: "0 24px 60px -20px rgba(139,92,246,0.35)" }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "var(--text-secondary)" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="!pl-11" placeholder="tu@email.com" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" style={{ color: "var(--text-secondary)" }} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
                  className="!pl-11" placeholder="Mínimo 6 caracteres" />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                <p>{error}</p>
                {error.includes("EXISTE") && (
                  <a href="/login" className="font-semibold underline mt-1 block" style={{ color: "#c4b5fd" }}>
                    Iniciar sesión
                  </a>
                )}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿Ya tenés cuenta?{" "}
          <a href="/login" className="font-semibold" style={{ color: "#c4b5fd" }}>Iniciar sesión</a>
        </p>
      </div>
    </div>
  );
}
