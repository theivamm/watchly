import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link, useLocation } from "react-router-dom";
import { Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const from = new URLSearchParams(location.search).get("from");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 relative overflow-hidden" style={{ backgroundColor: "transparent" }}>
      {from && (
        <Link to={from}
          className="absolute top-5 left-5 z-10 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.02]"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-primary)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </Link>
      )}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }} />
      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/" className="inline-block text-3xl font-extrabold tracking-tight mb-4 text-gradient">Watchly</a>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>Bienvenido de nuevo</h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>Accedé a tu biblioteca</p>
        </div>

        {/* Card */}
        <div className="glass p-8 rounded-[1.75rem]" style={{ boxShadow: "0 24px 60px -20px color-mix(in srgb, var(--accent) 35%, transparent)" }}>
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="!pl-11" placeholder="••••••••" />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="/recuperar-password" className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿No tenés cuenta?{" "}
          <a href="/registro" className="font-semibold" style={{ color: "var(--accent-light)" }}>Registrate</a>
        </p>
      </div>
    </div>
  );
}
