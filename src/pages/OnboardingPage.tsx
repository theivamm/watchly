import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/auth-context";
import AuthShell from "@/components/auth/AuthShell";
import { usePageTitle } from "@/hooks/usePageTitle";

const lbl = "text-xs font-extrabold uppercase tracking-widest text-white/70";

export default function OnboardingPage() {
  usePageTitle("Bienvenido a Watchly");
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
    <AuthShell title="Configurá tu perfil" subtitle="Elegí cómo querés que se vea tu Watchly">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className={lbl}>Nombre visible *</span>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
            className="glass-input" placeholder="Tu nombre" />
        </label>

        <label className="flex flex-col gap-2">
          <span className={lbl}>Username *</span>
          <span className="relative block">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/60 font-bold">@</span>
            <input type="text" value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
              required minLength={3} maxLength={30} className="glass-input with-icon" placeholder="tu-username" />
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <span className={lbl}>Biografía</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3}
            className="glass-input" placeholder="Contá algo sobre vos..." />
        </label>

        {error && <div className="px-4 py-3 rounded-2xl text-sm font-semibold border border-red-400/30 bg-red-500/15 text-red-200">{error}</div>}

        <button type="submit" disabled={loading || !username || username.length < 3}
          className="h-14 rounded-full bg-white text-[#111] font-extrabold text-base shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-50">
          {loading ? "Guardando..." : "Completar perfil"}
        </button>
      </form>
    </AuthShell>
  );
}
