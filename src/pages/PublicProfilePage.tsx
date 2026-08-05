import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Share2, Check, MapPin, Globe, Aperture, X, Lock, Film, List as ListIcon, ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getProfileByUsername, getProfileLink } from "@/services/profile";
import { getPublicLists } from "@/services/lists";
import type { Profile, List } from "@/types";

export default function PublicProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [lists, setLists] = useState<List[]>([]);
  const [copied, setCopied] = useState(false);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    setProfile(undefined);
    setLists([]);
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p && p.is_profile_public) {
          const l = await getPublicLists(p.id).catch(() => []);
          setLists(l);
        }
      })
      .catch(() => setProfile(null));
  }, [username]);

  const handleShare = async () => {
    if (!profile?.username) return;
    try {
      await navigator.clipboard.writeText(getProfileLink(profile.username));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-3xl font-bold"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}>
          ?
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil no encontrado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Este perfil no existe o cambió su usuario.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  if (!profile.is_profile_public && !isOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center"
          style={{ background: "var(--surface-2)" }}>
          <Lock className="w-10 h-10" style={{ color: "var(--text-secondary)" }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil privado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {profile.display_name || profile.username} no compartió su perfil.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  const initial = (profile.display_name || profile.username || "W").charAt(0).toUpperCase();
  const socials = [
    profile.website_url && { icon: Globe, href: profile.website_url, key: "web" },
    profile.instagram_url && { icon: Aperture, href: `https://instagram.com/${profile.instagram_url.replace(/^@/, "")}`, key: "ig" },
    profile.x_url && { icon: X, href: `https://x.com/${profile.x_url.replace(/^@/, "")}`, key: "x" },
  ].filter(Boolean) as { icon: typeof Globe; href: string; key: string }[];

  return (
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02] mb-8"
        style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] border p-8 md:p-12 text-center"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "rgba(139,92,246,0.25)" }}>
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-violet)" }} />
        <div className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full blur-[100px] animate-glow pointer-events-none"
          style={{ background: "var(--glow-pink)" }} />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full mb-5 flex items-center justify-center text-4xl font-extrabold"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 0 40px rgba(139,92,246,0.45)" }}>
            {initial}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm font-bold mb-5" style={{ color: "#c4b5fd" }}>@{profile.username}</p>

          {profile.bio && (
            <p className="max-w-lg text-base leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              {profile.bio}
            </p>
          )}

          {(profile.location || socials.length > 0) && (
            <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
              {profile.location && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold"
                  style={{ color: "var(--text-secondary)" }}>
                  <MapPin className="w-3.5 h-3.5" /> {profile.location}
                </span>
              )}
              {socials.map(({ icon: Icon, href, key }) => (
                <a key={key} href={href} target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            {isOwner ? (
              <Link to="/configuracion/perfil"
                className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                Editar perfil
              </Link>
            ) : (
              <button onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px rgba(139,92,246,0.45)" }}>
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "¡Link copiado!" : "Compartir"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 mt-6">
        {[
          { icon: Film, label: "Películas", value: lists.length },
          { icon: ListIcon, label: "Listas públicas", value: lists.length },
          { icon: Globe, label: "En Watchly", value: "Sí" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-2 p-5 rounded-2xl border"
            style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-extrabold leading-none text-gradient">{String(value)}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</p>
          </div>
        ))}
      </section>

      {/* Public lists */}
      <section className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight mb-5" style={{ color: "var(--text-primary)" }}>
          Listas públicas
        </h2>
        {lists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((list) => (
              <div key={list.id} className="group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1"
                style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
                <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full blur-[60px] opacity-0 group-hover:opacity-60 transition-opacity duration-500"
                  style={{ background: "var(--gradient-accent)" }} />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}>
                      <ListIcon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{list.name}</p>
                  </div>
                  {list.description && (
                    <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{list.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border"
            style={{ backgroundColor: "var(--surface-1)", borderColor: "var(--border)" }}>
            <ListIcon className="w-8 h-8 mb-3" style={{ color: "var(--text-secondary)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              {isOwner ? "Todavía no tenés listas públicas." : "Este perfil todavía no compartió listas."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
