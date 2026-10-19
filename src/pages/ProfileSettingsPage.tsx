import { useEffect, useState, type ReactNode } from "react";
import "@/styles/cinema.css";
import { Share2, Check, AtSign, MapPin, Globe, Aperture, X } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { updateProfile, getProfileLink } from "@/services/profile";
import type { Profile } from "@/types";
import SettingsNav from "@/components/layout/SettingsNav";
import Avatar from "@/components/ui/Avatar";
import AvatarPicker from "@/components/profile/AvatarPicker";
import PageHeader from "@/components/ui/PageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof X; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white/70 mb-2.5">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</span>
      {children}
    </label>
  );
}

function Toggle({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-6 py-5 border-t border-white/15 text-left">
      <span className="min-w-0"><span className="block text-lg font-extrabold">{title}</span><span className="block text-sm text-white/65 mt-1">{hint}</span></span>
      <span className="relative shrink-0 w-16 h-9 rounded-full border border-white/25 transition-colors" style={{ background: checked ? "#fff" : "rgba(255,255,255,.1)" }}>
        <span className="absolute top-1 w-7 h-7 rounded-full transition-all duration-300" style={{ left: checked ? 32 : 4, background: checked ? "#111" : "#fff" }} />
      </span>
    </button>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/20 pt-6">
      <h2 className="font-cinema text-3xl md:text-4xl leading-none">{title}</h2>
      {hint && <p className="text-xs font-bold text-white/65 mt-2">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function ProfileSettingsPage() {
  usePageTitle("Configuración de perfil | Watchly");
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const set = (key: keyof Profile, value: string | boolean | null) => setForm((f) => ({ ...f, [key]: value }));

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
        show_dna_publicly: form.show_dna_publicly ?? true,
        avatar_id: form.avatar_id ?? null,
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

  const icon = "absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60";
  const input = "glass-input !h-14 !text-base";
  const withIcon = "glass-input with-icon !h-14 !text-base";

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
      <PageHeader title="Ajustes" eyebrow="Configuración"
        subtitle={<span className="inline-flex items-center gap-4"><Avatar profile={form as Profile} size={56} /><span><span className="block font-extrabold text-white">{form.display_name || user?.email?.split("@")[0]}</span><span className="block text-sm text-white/70">@{profile?.username || "..."}</span></span></span>} />
      <SettingsNav />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-12 min-w-0">
          <Section title="Identidad" hint="Cómo te ven los demás">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nombre para mostrar"><input value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} placeholder="Tu nombre" className={input} /></Field>
              <Field label="Usuario (link público)" icon={AtSign}><input value={form.username ?? ""} onChange={(e) => set("username", e.target.value)} placeholder="usuario" className={input} /></Field>
            </div>
            <div className="mt-5">
              <Field label="Descripción"><textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} placeholder="Contá quién sos, qué te gusta ver..." rows={4} className="glass-input !text-base !p-5" /></Field>
            </div>
          </Section>

          <Section title="Presencia" hint="Dónde encontrarte">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Ubicación" icon={MapPin}><div className="relative"><MapPin className={icon} /><input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Ciudad, País" className={withIcon} /></div></Field>
              <Field label="Sitio web" icon={Globe}><div className="relative"><Globe className={icon} /><input value={form.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." className={withIcon} /></div></Field>
              <Field label="Instagram" icon={Aperture}><div className="relative"><Aperture className={icon} /><input value={form.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} placeholder="usuario" className={withIcon} /></div></Field>
              <Field label="X (Twitter)" icon={X}><div className="relative"><X className={icon} /><input value={form.x_url ?? ""} onChange={(e) => set("x_url", e.target.value)} placeholder="usuario" className={withIcon} /></div></Field>
            </div>
          </Section>

          <Section title="Privacidad" hint="Vos decidís qué se comparte">
            <Toggle title="Perfil público" hint="Si está desactivado, tu perfil no se puede ver al compartirlo" checked={form.is_profile_public ?? true} onChange={(v) => set("is_profile_public", v)} />
            <Toggle title="Mostrar mi ADN Audiovisual" hint="Si está desactivado, tu ADN no aparece en tu perfil público" checked={form.show_dna_publicly ?? true} onChange={(v) => set("show_dna_publicly", v)} />
          </Section>

          <div className="space-y-3">
            {message && <p className="text-sm font-bold" style={{ color: message.type === "ok" ? "#4ade80" : "#f87171" }}>{message.text}</p>}
            <button onClick={handleSave} disabled={saving} className="w-full h-16 rounded-full bg-white text-[#111] text-base font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.01] disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar perfil"}
            </button>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 h-fit">
          <div className="liquid-glass rounded-[2.25rem] p-6 md:p-7">
            <h2 className="font-cinema text-3xl leading-none mb-5">Tu avatar</h2>
            {user && <AvatarPicker userId={user.id} currentId={form.avatar_id ?? null} onChange={(id) => setForm((f) => ({ ...f, avatar_id: id }))} />}
          </div>
          <div className="liquid-glass rounded-[2.25rem] p-6 md:p-7 space-y-4">
            <h2 className="font-cinema text-3xl leading-none">Tu perfil público</h2>
            {profile?.username ? (
              <>
                <div className="liquid-glass-sm rounded-2xl px-4 py-3 text-sm break-all text-white/85">{getProfileLink(profile.username)}</div>
                <button onClick={handleShare} className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-white text-[#111] text-sm font-extrabold transition-transform hover:scale-[1.02]">
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? "¡Link copiado!" : "Copiar link"}
                </button>
                <a href={getProfileLink(profile.username)} className="liquid-glass-sm flex items-center justify-center h-12 rounded-full text-sm font-extrabold text-white hover:text-white transition-transform hover:scale-[1.02]">Ver mi perfil</a>
              </>
            ) : <p className="text-sm text-white/70">Guardá el perfil para generar tu link público.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
