import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Share2, Check, Star, Film, Tv, Quote, Lock, ArrowLeft, Plus, User } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getProfileByUsername, getMediaShareLink } from "@/services/profile";
import { getEntry } from "@/services/library";
import { getPosterUrl, getBackdropUrl, getMediaDetails } from "@/services/tmdb";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import UserMenu from "@/components/layout/UserMenu";
import type { Profile, Entry, EntryStatus, MediaType, TMDBSearchResult, TMDBMediaDetails } from "@/types";

const STATUS_LABELS: Record<EntryStatus, string> = {
  want_to_watch: "Quiero ver",
  watching: "Viendo",
  completed: "Completado",
  paused: "Pausado",
  dropped: "Abandonado",
};

const STATUS_COLORS: Record<EntryStatus, string> = {
  want_to_watch: "var(--accent)",
  watching: "#4ade80",
  completed: "#60a5fa",
  paused: "#facc15",
  dropped: "#f87171",
};

export default function SharedMediaPage() {
  const { username = "", mediaType = "", tmdbId = "" } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [details, setDetails] = useState<TMDBMediaDetails | null>(null);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);

  const type: MediaType | null = mediaType === "movie" || mediaType === "tv" ? mediaType : null;
  const id = Number(tmdbId);
  const valid = type !== null && Number.isFinite(id) && id > 0;
  const shareUrl = valid && profile ? getMediaShareLink(profile.username, type as MediaType, id) : null;

  useEffect(() => {
    setProfile(undefined);
    setEntry(null);
    setDetails(null);
    setCopied(false);
    if (!valid) {
      setProfile(null);
      return;
    }
    let active = true;
    getProfileByUsername(username)
      .then(async (p) => {
        if (!active) return;
        setProfile(p);
        if (p && p.is_profile_public) {
          const e = await getEntry(p.id, id, type as MediaType).catch(() => null);
          if (!active) return;
          setEntry(e);
          if (e) {
            getMediaDetails(type as "movie" | "tv", id)
              .then((d) => {
                if (active) setDetails(d);
              })
              .catch(() => {});
          }
        }
      })
      .catch(() => {
        if (active) setProfile(null);
      });
    return () => {
      active = false;
    };
  }, [username, mediaType, tmdbId, type, id, valid]);

  const handleShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const result: TMDBSearchResult | null = entry && type && {
    tmdbId: id,
    mediaType: type,
    title: entry.title,
    originalTitle: entry.title,
    overview: details?.overview || "",
    year: details?.year ?? null,
    releaseDate: null,
    posterPath: entry.poster_path || details?.posterPath || null,
    backdropPath: details?.backdropPath ?? null,
    genreIds: [],
    tmdbRating: details?.tmdbRating ?? null,
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
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 0 40px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          ?
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Perfil no encontrado
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          Este perfil no existe o cambió su usuario.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  if (!profile.is_profile_public) {
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
          Este perfil no es público, así que su tarjeta no puede verse.
        </p>
        <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          Ir a Watchly
        </Link>
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 rounded-full mb-4 flex items-center justify-center text-3xl font-bold"
          style={{ background: "var(--surface-2)" }}>
          ?
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
          Esta tarjeta ya no está disponible
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {profile.display_name || profile.username} la sacó de su biblioteca o el link es incorrecto.
        </p>
        <Link to={`/perfil/${profile.username}`} className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          Ver su perfil
        </Link>
      </div>
    );
  }

  const description = details?.overview || entry.description;
  const year = details?.year ?? null;
  const posterUrl = getPosterUrl(entry.poster_path || details?.posterPath || null, "w500");
  const backdropUrl = details?.backdropPath ? getBackdropUrl(details.backdropPath) : posterUrl;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <img src={backdropUrl} alt="" aria-hidden="true"
          className="w-full h-full object-cover blur-2xl scale-125 opacity-30" loading="lazy" />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.9) 0%, rgba(11,11,20,0.55) 50%, rgba(11,11,20,0.95) 100%)" }} />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[120px] animate-glow pointer-events-none"
          style={{ background: "color-mix(in srgb, var(--accent) 25%, transparent)" }} />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-8 md:py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link to={`/perfil/${profile.username}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-primary)", backdropFilter: "blur(8px)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Perfil de {profile.display_name || profile.username}
          </Link>

          <button onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "¡Link copiado!" : "Copiar link"}
          </button>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-[2rem] border animate-pop"
          style={{
            backgroundColor: "var(--surface-1)",
            borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)",
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--accent) 15%, transparent), 0 40px 80px -20px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 120px 20px color-mix(in srgb, var(--accent) 15%, transparent)",
          }}>
          <div className="flex flex-col sm:flex-row">
            {/* Poster */}
            <div className="relative sm:w-56 shrink-0">
              <img src={posterUrl} alt={entry.title}
                className="w-full h-56 sm:h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 sm:bg-none"
                style={{ background: "linear-gradient(0deg, var(--surface-1) 0%, transparent 40%)" }} />
              <div className="absolute inset-0 hidden sm:block"
                style={{ background: "linear-gradient(90deg, transparent 60%, var(--surface-1) 100%)" }} />
            </div>

            {/* Content */}
            <div className="relative flex-1 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                  style={{ backgroundColor: STATUS_COLORS[entry.status], color: "#000" }}>
                  {STATUS_LABELS[entry.status]}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  {entry.media_type === "movie" ? (
                    <span className="inline-flex items-center gap-1"><Film className="w-3 h-3" /> Película</span>
                  ) : (
                    <span className="inline-flex items-center gap-1"><Tv className="w-3 h-3" /> Serie</span>
                  )}
                  {year ? ` · ${year}` : ""}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
                {entry.title}
              </h1>

              {entry.rating != null && entry.rating > 0 && (
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4"
                      style={{
                        fill: entry.rating! >= star ? "var(--accent)" : "none",
                        color: entry.rating! >= star ? "var(--accent)" : "var(--text-secondary)",
                      }} />
                  ))}
                  <span className="ml-2 text-sm font-bold" style={{ color: "var(--accent-light)" }}>
                    {entry.rating}/5
                  </span>
                </div>
              )}

              {description ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Descripción
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{description}</p>
                </>
              ) : (
                <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
                  Sin descripción disponible.
                </p>
              )}

              {entry.notes && (
                <div className="mt-4 rounded-xl border p-3"
                  style={{ backgroundColor: "var(--surface-2)", borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)" }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Quote className="w-3.5 h-3.5" style={{ color: "var(--accent-light)" }} />
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                      Comentario de {profile.display_name || profile.username}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{entry.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="border-t p-6 md:p-8"
            style={{ borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)", backgroundColor: "rgba(11,11,20,0.35)" }}>
            {user ? (
              <button onClick={() => setAdding(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px color-mix(in srgb, var(--accent) 55%, transparent)" }}>
                <Plus className="w-4 h-4" strokeWidth={2.6} /> Agregar a mi biblioteca
              </button>
            ) : (
              <div className="text-center">
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>
                  ¿Te gusta? Guardala en tu biblioteca y creá tu propio perfil.
                </p>
                <div className="flex gap-3">
                  <Link to="/login"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--text-primary)", border: "1.5px solid var(--border)" }}>
                    <User className="w-4 h-4" /> Iniciar sesión
                  </Link>
                  <Link to="/registro"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 8px 28px color-mix(in srgb, var(--accent) 55%, transparent)" }}>
                    <Plus className="w-4 h-4" strokeWidth={2.6} /> Crear cuenta
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] font-semibold mt-6" style={{ color: "var(--text-secondary)" }}>
          Compartido desde Watchly · <Link to={`/perfil/${profile.username}`} style={{ color: "var(--accent-light)" }}>
            {profile.display_name || profile.username}
          </Link>
        </p>
      </div>

      {adding && result && (
        <MediaDetailModal
          result={result}
          shareUrl={shareUrl}
          onClose={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
    </div>
  );
}
