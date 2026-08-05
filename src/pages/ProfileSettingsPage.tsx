import { useEffect, useState } from "react";
import { User, Share2, Check, AtSign, MapPin, Globe, Aperture, X } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { updateProfile, getProfileLink } from "@/services/profile";
import type { Profile } from "@/types";
import SettingsNav from "@/components/layout/SettingsNav";

export default function ProfileSettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  const set = (key: keyof Profile, value: string | boolean | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateProfile(user.id, {
        display_name: (form.display_name ?? "").trim(),
        username: (form.username ?? "").trim().replace(/^@/, ""),
        bio: form.bio || null,
        location: form.location || null,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
        x_url: form.x_url || null,
        is_profile_public: form.is_profile_public ?? true,
      });
      await refreshProfile();
      setMessage({ type: "ok", text: "Perfil guardado correctamente." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "err", text: "No se pudo guardar. Verificá que el usuario no esté en uso." });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!profile?.username) return;
    const link = getProfileLink(profile.username);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: "err", text: `Copiá manualmente: ${link}` });
    }
  };

  const inputStyle = {
    backgroundColor: "var(--surface-2)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-8" style={{ color: "var(--text-primary)" }}>
        Perfil
      </h1>

      <SettingsNav />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 rounded-3xl border p-6 md:p-8 space-y-5"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 16px rgba(139,92,246,0.4)" }}>
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {form.display_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                @{profile?.username || "..."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Nombre para mostrar
              </label>
              <input value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)}
                placeholder="Tu nombre" className="w-full !rounded-xl !py-3" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Usuario (para tu link público)
              </label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input value={form.username ?? ""} onChange={(e) => set("username", e.target.value)}
                  placeholder="usuario" className="w-full !pl-10 !rounded-xl !py-3" style={inputStyle} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
              Descripción
            </label>
            <textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)}
              placeholder="Contá quién sos, qué te gusta ver..." rows={3}
              className="w-full !rounded-xl !py-3 resize-none" style={inputStyle} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)}
                  placeholder="Ciudad, País" className="w-full !pl-10 !rounded-xl !py-3" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Sitio web
              </label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input value={form.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)}
                  placeholder="https://..." className="w-full !pl-10 !rounded-xl !py-3" style={inputStyle} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                Instagram
              </label>
              <div className="relative">
                <Aperture className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input value={form.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)}
                  placeholder="usuario" className="w-full !pl-10 !rounded-xl !py-3" style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                X (Twitter)
              </label>
              <div className="relative">
                <X className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                <input value={form.x_url ?? ""} onChange={(e) => set("x_url", e.target.value)}
                  placeholder="usuario" className="w-full !pl-10 !rounded-xl !py-3" style={inputStyle} />
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between gap-4 rounded-2xl p-4 cursor-pointer"
            style={{ backgroundColor: "var(--surface-2)", border: "1.5px solid var(--border)" }}>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Perfil público</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Si está desactivado, tu perfil no se puede ver al compartirlo
              </p>
            </div>
            <input type="checkbox" checked={form.is_profile_public ?? true}
              onChange={(e) => set("is_profile_public", e.target.checked)}
              className="w-5 h-5 accent-[#8b5cf6]" />
          </label>

          {message && (
            <p className="text-sm font-bold" style={{ color: message.type === "ok" ? "#4ade80" : "#f87171" }}>
              {message.text}
            </p>
          )}

          <button onClick={handleSave} disabled={saving}
            className="w-full px-6 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
            {saving ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>

        {/* Share card */}
        <div className="rounded-3xl border p-6 space-y-5 h-fit lg:sticky lg:top-6"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.2)" }}>
          <h2 className="text-base font-extrabold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Share2 className="w-4 h-4" style={{ color: "#c4b5fd" }} /> Tu perfil público
          </h2>
          {profile?.username ? (
            <>
              <div className="rounded-2xl border px-4 py-3 text-sm break-all"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {getProfileLink(profile.username)}
              </div>
              <button onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "¡Link copiado!" : "Copiar link"}
              </button>
              <a href={getProfileLink(profile.username)}
                className="block w-full text-center px-5 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                Ver mi perfil
              </a>
            </>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Guardá el perfil para generar tu link público.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
