import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
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
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Nueva contraseña</h1>
          <p style={{ color: "var(--text-secondary)" }}>Ingresá tu nueva contraseña</p>
        </div>

        <div
          className="rounded-3xl border p-6 md:p-8"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          {success ? (
            <div className="text-center py-4">
              <p style={{ color: "#c4b5fd" }}>Contraseña actualizada. Redirigiendo...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  placeholder="Mínimo 6 caracteres"
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
                {loading ? "Actualizando..." : "Actualizar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
