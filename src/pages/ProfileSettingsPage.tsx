
import { useEffect, useState, type ReactNode } from "react";
import "@/styles/cinema.css";
import { Share2, Check, AtSign, MapPin, Globe, Aperture, X, AlertTriangle, Trash2, LogOut, Mail, ExternalLink } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { supabase } from "@/lib/supabase";
import { updateProfile, getProfileLink } from "@/services/profile";
import { getPosterUrl } from "@/services/tmdb";
import { useRandomCovers } from "@/hooks/useRandomCovers";
import type { Profile } from "@/types";
import Avatar from "@/components/ui/Avatar";
import AvatarPicker from "@/components/profile/AvatarPicker";
import { usePageTitle } from "@/hooks/usePageTitle";

const edge = "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4)";

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof X; children: ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-white/65 mb-2">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</span>
      {children}
    </label>
  );
}

function Toggle({ title, hint, checked, onChange }: { title: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="w-full flex items-center justify-between gap-6 py-4 border-t border-white/15 text-left">
      <span className="min-w-0"><span className="block text-base font-extrabold">{title}</span><span className="block text-sm text-white/65 mt-0.5">{hint}</span></span>
      <span className="relative shrink-0 w-14 h-8 rounded-full border border-white/25 transition-colors" style={{ background: checked ? "linear-gradient(135deg, #ff7aa6, #7cc4ff)" : "rgba(255,255,255,.1)" }}>
        <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,.4)] transition-all duration-300" style={{ left: checked ? 28 : 3 }} />
      </span>
    </button>
  );
}

function Section({ title, hint, children, tone }: { title: string; hint?: string; children: ReactNode; tone?: string }) {
  return (
    <section className="border-t pt-6" style={{ borderColor: tone ?? "rgba(255,255,255,.2)" }}>
      <h2 className="font-cinema text-3xl md:text-4xl leading-none" style={tone ? { color: "#fca5a5" } : undefined}>{title}</h2>
      {hint && <p className="text-xs font-bold text-white/65 mt-2">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function ProfileSettingsPage() {
  usePageTitle("Configuración | Watchly");
  const { user, profile, refreshProfile } = useAuth();
  const covers = useRandomCovers(24);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // No pisar lo que el usuario está editando cuando el perfil se recarga en segundo plano.
  useEffect(() => { if (profile && !dirty) setForm(profile); }, [profile, dirty]);
  useEffect(() => { if (message?.type === "ok") { const t = setTimeout(() => setMessage(null), 3500); return () => clearTimeout(t); } }, [message]);

  const set = (key: keyof Profile, value: string | boolean | null) => {
    setDirty(true);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      const saved = await updateProfile(user.id, {
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
      setForm(saved);
      setDirty(false);
      await refreshProfile();
      setMessage({ type: "ok", text: "Perfil guardado correctamente." });
    } catch (err) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      setMessage({ type: "err", text: code === "23505" ? "Ese usuario ya está en uso. Probá con otro." : "No se pudo guardar. Revisá tu conexión e intentá de nuevo." });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE" && confirmText !== "BORRAR") return;
    setDeleting(true);
    setDeleteError("");
    try {
      const { error } = await supabase.rpc("delete_user");
      if (error) setDeleteError(error.message);
      else { await supabase.auth.signOut(); window.location.href = "/?account_deleted=1"; }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setDeleting(false);
    }
  };

  const icon = "absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60";
  const input = "glass-input !h-12 !text-base";
  const withIcon = "glass-input with-icon !h-12 !text-base";
  const link = profile?.username ? getProfileLink(profile.username) : "";
  const pill = "liquid-glass-sm inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-sm font-extrabold text-white hover:text-white transition-transform hover:scale-[1.03]";
  const showBar = dirty || !!message;

  return (
    <div className="w-full px-4 md:px-6 pt-20 pb-32 text-white space-y-14">
      {/* ───────── PORTADA ───────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] p-7 md:p-10" style={{ boxShadow: `${edge}, 0 30px 80px -20px rgba(0,0,0,.6)` }}>
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[18%] grid gap-3 -rotate-[8deg]" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
            {Array.from({ length: 36 }, (_, i) => covers[i % Math.max(1, covers.length)]).filter(Boolean).map((c, i) => (
              <img key={i} src={getPosterUrl(c.posterPath, "w200")} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover rounded-xl" style={{ marginTop: i % 2 ? 30 : 0 }} />
            ))}
          </div>
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.94) 0%, rgba(8,7,14,.8) 45%, rgba(8,7,14,.45) 100%)" }} />
        </div>
        <div className="relative flex flex-wrap items-center gap-x-8 gap-y-6">
          <div className="rounded-full p-1 shrink-0" style={{ background: "linear-gradient(135deg, #ff5a8c, #fff 50%, #5aaaff)" }}>
            <div className="rounded-full p-1 bg-[#0b0b14]"><Avatar profile={form as Profile} size={116} /></div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[.25em] text-white/70">Configuración</p>
            <h1 className="font-cinema text-6xl md:text-8xl leading-[.95] truncate mt-1">{form.display_name || user?.email?.split("@")[0]}</h1>
            <p className="text-base font-bold text-white/75 mt-2">@{profile?.username || "..."}{user?.email ? <span className="text-white/50"> · {user.email}</span> : null}</p>
          </div>
          {link && (
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleShare} className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-white text-[#111] text-sm font-extrabold transition-transform hover:scale-[1.03]">
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}{copied ? "¡Link copiado!" : "Copiar link"}
              </button>
              <a href={link} className={pill}><ExternalLink className="w-4 h-4" /> Ver mi perfil</a>
            </div>
          )}
        </div>
      </section>

      {/* ───────── AVATAR ───────── */}
      <section>
        <h2 className="font-cinema text-3xl md:text-4xl leading-none">Tu avatar</h2>
        <div className="mt-6">
          {user && <AvatarPicker size={72} userId={user.id} currentId={form.avatar_id ?? null} onChange={(id) => { setDirty(true); setForm((f) => ({ ...f, avatar_id: id })); }} />}
        </div>
      </section>

      {/* ───────── FORMULARIOS ───────── */}
      <div className="grid gap-x-16 gap-y-12 xl:grid-cols-2">
        <div className="space-y-12 min-w-0">
          <Section title="Identidad" hint="Cómo te ven los demás">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre para mostrar"><input value={form.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} placeholder="Tu nombre" className={input} /></Field>
              <Field label="Usuario (link público)" icon={AtSign}><input value={form.username ?? ""} onChange={(e) => set("username", e.target.value)} placeholder="usuario" className={input} /></Field>
            </div>
            <div className="mt-4">
              <Field label="Descripción"><textarea value={form.bio ?? ""} onChange={(e) => set("bio", e.target.value)} placeholder="Contá quién sos, qué te gusta ver..." rows={4} className="glass-input !text-base !p-5" /></Field>
            </div>
          </Section>

          <Section title="Presencia" hint="Dónde encontrarte">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ubicación" icon={MapPin}><div className="relative"><MapPin className={icon} /><input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Ciudad, País" className={withIcon} /></div></Field>
              <Field label="Sitio web" icon={Globe}><div className="relative"><Globe className={icon} /><input value={form.website_url ?? ""} onChange={(e) => set("website_url", e.target.value)} placeholder="https://..." className={withIcon} /></div></Field>
              <Field label="Instagram" icon={Aperture}><div className="relative"><Aperture className={icon} /><input value={form.instagram_url ?? ""} onChange={(e) => set("instagram_url", e.target.value)} placeholder="usuario" className={withIcon} /></div></Field>
              <Field label="X (Twitter)" icon={X}><div className="relative"><X className={icon} /><input value={form.x_url ?? ""} onChange={(e) => set("x_url", e.target.value)} placeholder="usuario" className={withIcon} /></div></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-12 min-w-0">
          <Section title="Privacidad" hint="Vos decidís qué se comparte">
            <Toggle title="Perfil público" hint="Si está desactivado, tu perfil no se puede ver al compartirlo" checked={form.is_profile_public ?? true} onChange={(v) => set("is_profile_public", v)} />
            <Toggle title="Mostrar mi ADN Audiovisual" hint="Si está desactivado, tu ADN no aparece en tu perfil público" checked={form.show_dna_publicly ?? true} onChange={(v) => set("show_dna_publicly", v)} />
          </Section>

          <Section title="Cuenta" hint="Email y sesión">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="flex items-center gap-3 text-base font-bold break-all min-w-0"><Mail className="w-5 h-5 text-white/60 shrink-0" />{user?.email}</p>
              <button onClick={handleLogout} className={pill} style={{ color: "#fca5a5" }}><LogOut className="w-4 h-4" /> Cerrar sesión</button>
            </div>
          </Section>

          <Section title="Eliminar cuenta" hint="Esta acción es irreversible. Se eliminan todos tus datos, listas y progresos." tone="rgba(248,113,113,.55)">
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)} className={pill} style={{ color: "#fca5a5" }}><Trash2 className="w-4 h-4" /> Eliminar cuenta</button>
            ) : (
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-sm text-white/85"><AlertTriangle className="w-4 h-4 text-red-300 shrink-0" /> Escribí <strong>DELETE</strong> o <strong>BORRAR</strong> para confirmar:</p>
                <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={input} placeholder="DELETE" />
                {deleteError && <p className="text-sm font-bold text-red-300">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={handleDeleteAccount} disabled={deleting || (confirmText !== "DELETE" && confirmText !== "BORRAR")}
                    className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-full text-sm font-extrabold transition-transform hover:scale-[1.02] disabled:opacity-50"
                    style={{ backgroundColor: "#f87171", color: "#2a0a0a", boxShadow: "0 8px 28px rgba(248,113,113,.35)" }}>
                    {deleting ? "Eliminando..." : <><Check className="w-4 h-4" /> Confirmar</>}
                  </button>
                  <button onClick={() => { setShowConfirm(false); setConfirmText(""); setDeleteError(""); }} className="liquid-glass-sm flex-1 h-12 rounded-full text-sm font-extrabold">Cancelar</button>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* ───────── BARRA DE GUARDADO ───────── */}
      {showBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 pl-6 pr-2 py-2 rounded-full animate-slide-up" style={{ background: "linear-gradient(135deg, rgba(255,60,130,.28), rgba(12,10,24,.9) 50%, rgba(40,190,255,.26))", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,.25)", boxShadow: "0 24px 60px -12px rgba(0,0,0,.8)" }}>
          <span className="text-sm font-bold" style={{ color: message ? (message.type === "ok" ? "#86efac" : "#fca5a5") : "rgba(255,255,255,.85)" }}>
            {message ? message.text : "Tenés cambios sin guardar"}
          </span>
          {dirty && (
            <button onClick={handleSave} disabled={saving} className="h-11 px-7 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_8px_24px_rgba(0,0,0,.4)] transition-transform hover:scale-[1.04] disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
