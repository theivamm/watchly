import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      username: username.toLowerCase(),
      bio: bio || null,
      theme_preference: "dark",
      accent_color: "violet",
      onboarding_completed: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    window.location.href = "/inicio";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 md:px-8 py-8 md:py-12" style={{ backgroundColor: "transparent" }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
            Configurá tu perfil
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Elegí cómo querés que se vea tu Watchly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border p-6 md:p-8 space-y-4" style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Nombre visible *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-base outline-none"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Username *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-3.5 rounded-l-xl text-base" style={{ backgroundColor: "var(--surface-3)", color: "var(--text-secondary)" }}>
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                  required
                  minLength={3}
                  maxLength={30}
                  className="flex-1 px-4 py-3.5 rounded-r-xl text-base outline-none border-l-0"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                  placeholder="tu-username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Biografía
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={3}
                className="w-full px-4 py-3.5 rounded-xl text-base outline-none resize-none"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                placeholder="Contá algo sobre vos..."
              />
            </div>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || username.length < 3}
            className="w-full h-12 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--gradient-accent)", color: "var(--accent-contrast)", boxShadow: "0 2px 10px color-mix(in srgb, var(--accent) 35%, transparent)" }}
          >
            {loading ? "Guardando..." : "Completar perfil"}
          </button>
        </form>
      </div>
    </div>
  );
}
