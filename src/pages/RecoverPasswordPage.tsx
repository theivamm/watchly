import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RecoverPasswordPage() {
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
      <div
        className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
        style={{ backgroundColor: "transparent" }}
      >
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }}
        />
        <div className="relative text-center max-w-md">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "var(--gradient-accent)",
              boxShadow: "0 4px 18px rgba(139,92,246,0.4)",
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>Revisá tu email</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Te enviamos un enlace para recuperar tu contraseña.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 md:px-8 py-8 md:py-12 relative overflow-hidden"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] animate-glow pointer-events-none"
        style={{ background: "var(--glow-violet)" }}
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Recuperar contraseña</h1>
          <p style={{ color: "var(--text-secondary)" }}>Ingresá tu email y te enviaremos un enlace</p>
        </div>

        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="tu@email.com"
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          <a href="/login" className="font-semibold" style={{ color: "#c4b5fd" }}>Volver al login</a>
        </p>
      </div>
    </div>
  );
}
