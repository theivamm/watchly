import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  Sparkles, Clapperboard, Tv, Calendar, Globe, Languages, Star,
  Tags, ShieldCheck, User, Lock, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { getProfileByUsername } from "@/services/profile";
import { getPublicDnaByUsername } from "@/services/dna";
import { getPublicLibrary } from "@/services/library";
import { getPosterUrl } from "@/services/tmdb";
import { getDominantColor, rgba, rgbString, lighten, DEFAULT_TINT, type RGB } from "@/lib/posterColor";
import UserMenu from "@/components/layout/UserMenu";
import type { Profile, UserDNA, Entry } from "@/types";
import { GenreLegend } from "@/components/dna/GenreFingerprint";
import { usePageTitle } from "@/hooks/usePageTitle";

function Row({ icon: Icon, title, children, accentBorder, iconBg }: {
  icon: typeof Star;
  title: string;
  children: React.ReactNode;
  accentBorder?: string;
  iconBg?: string;
}) {
  return (
    <div className="rounded-3xl border p-6"
      style={{ backgroundColor: "rgba(19,19,31,0.55)", borderColor: accentBorder || "color-mix(in srgb, var(--accent) 18%, transparent)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: iconBg || "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Chips({ items }: { items: { label: string; percentage: number; key: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.key}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
          style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
          {item.label} <span className="text-xs font-extrabold opacity-80">{item.percentage}%</span>
        </span>
      ))}
    </div>
  );
}

export default function PublicDNAPage() {
  const { username = "" } = useParams();
  const { pathname } = useLocation();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  usePageTitle(`ADN Audiovisual de ${profile?.display_name || `@${username}`} | Watchly`);
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [tint, setTint] = useState<RGB>(DEFAULT_TINT);

  useEffect(() => {
    let cancelled = false;
    setProfile(undefined);
    setDna(null);
    setEntries([]);
    setLoaded(false);
    getProfileByUsername(username)
      .then(async (p) => {
        if (cancelled) return;
        setProfile(p);
        if (p && p.is_profile_public && p.show_dna_publicly) {
          const [d, e] = await Promise.all([
            getPublicDnaByUsername(username).catch(() => null),
            getPublicLibrary(p.id).catch(() => []),
          ]);
          if (!cancelled) {
            setDna(d);
            setEntries(e);
            setLoaded(true);
          }
        } else {
          if (!cancelled) setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  const heroCovers = useMemo(() => entries.filter((e) => e.poster_path).slice(0, 5), [entries]);

  useEffect(() => {
    if (heroCovers.length <= 1) return;
    setBgIndex(0);
    const t = setInterval(() => setBgIndex((i) => (i + 1) % heroCovers.length), 4000);
    return () => clearInterval(t);
  }, [heroCovers.length]);

  const activeCover = heroCovers[bgIndex];

  useEffect(() => {
    if (!activeCover?.poster_path) return;
    getDominantColor(getPosterUrl(activeCover.poster_path, "w200"))
      .then(setTint)
      .catch(() => setTint(DEFAULT_TINT));
  }, [activeCover?.poster_path]);

  const accentText = rgbString(lighten(tint, 0.45));
  const accentSoft = rgba(tint, 0.14);
  const accentBorder = rgba(tint, 0.3);
  const tintGlow = rgba(tint, 0.4);
  const tintGradient = `linear-gradient(135deg, ${rgbString(tint)} 0%, ${rgbString(lighten(tint, 0.28))} 55%, ${rgbString(lighten(tint, 0.5))} 100%)`;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
      </div>
    );
  }

  const renderCenter = (icon: React.ReactNode, title: string, body: string, cta?: React.ReactNode) => (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-24 h-24 rounded-full mb-5 flex items-center justify-center"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        {icon}
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <p className="text-sm mb-6 max-w-md" style={{ color: "var(--text-secondary)" }}>{body}</p>
      {cta}
    </div>
  );

  if (profile == null) {
    return renderCenter(
      <AlertTriangle className="w-10 h-10" style={{ color: "var(--text-secondary)" }} />,
      "Perfil no encontrado",
      "Este perfil no existe o cambió su usuario.",
      <Link to="/" className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
        Ir a Watchly
      </Link>
    );
  }

  if (!profile.is_profile_public || !profile.show_dna_publicly) {
    return renderCenter(
      <Lock className="w-10 h-10" style={{ color: "var(--text-secondary)" }} />,
      "ADN privado",
      `${profile.display_name || profile.username} no comparte su ADN Audiovisual.`,
      <Link to={`/perfil/${username}`} className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
        Ver perfil
      </Link>
    );
  }

  if (!dna || dna.status === "locked") {
    return renderCenter(
      <Sparkles className="w-10 h-10" style={{ color: "var(--text-secondary)" }} />,
      "Su ADN sigue tomando forma",
      `${profile.display_name || profile.username} todavía no alcanzó los títulos suficientes para mostrar su ADN.`,
      <Link to={`/perfil/${username}`} className="px-6 py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
        Ver perfil
      </Link>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Full-page blurred covers, cycling with tint */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {heroCovers.map((entry, i) => (
          <img
            key={entry.id}
            src={getPosterUrl(entry.poster_path, "w500")}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2200ms] ease-in-out"
            style={{
              opacity: i === bgIndex ? 1 : 0,
              filter: "blur(22px) saturate(1.15)",
              transform: "scale(1.15)",
            }}
          />
        ))}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(11,11,20,0.9) 0%, rgba(11,11,20,0.55) 50%, rgba(11,11,20,0.95) 100%)" }} />
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full blur-[120px] animate-glow pointer-events-none"
          style={{ background: rgba(tint, 0.45) }} />
        <div className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full blur-[110px] pointer-events-none"
          style={{ background: rgba(lighten(tint, 0.3), 0.22) }} />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <div className="relative z-10 w-full px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto">
        <Link to={`/perfil/${profile.username}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold mb-6 transition-all hover:scale-[1.02]"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "var(--text-primary)", backdropFilter: "blur(8px)" }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al perfil de {profile.display_name || profile.username}
        </Link>

        <div className="relative overflow-hidden rounded-[2rem] border p-7 md:p-10 mb-8 text-center"
          style={{ backgroundColor: "rgba(19,19,31,0.55)", borderColor: accentBorder, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
            style={{ background: rgba(tint, 0.35) }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
              style={{ backgroundColor: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}>
              <Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-1 text-gradient">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm font-bold mb-4" style={{ color: accentText }}>@{profile.username}</p>
            {dna.summary && (
              <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6" style={{ color: "var(--text-primary)" }}>
                {dna.summary}
              </p>
            )}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: accentText }} />
              Calculado con {dna.validTitleCount} títulos
            </div>
          </div>
        </div>

        {dna.topGenres.length > 0 && (
          <div className="rounded-3xl border p-6 md:p-8 mb-6"
            style={{ backgroundColor: "rgba(19,19,31,0.55)", borderColor: accentBorder, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
            <h2 className="text-lg font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
              Géneros principales
            </h2>
            <GenreLegend genres={dna.topGenres} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Row icon={Clapperboard} title="Películas vs series" accentBorder={accentBorder} iconBg={tintGradient}>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}>
                <Clapperboard className="w-3.5 h-3.5" /> {dna.formatDistribution.movie}%
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                <Tv className="w-3.5 h-3.5" /> {dna.formatDistribution.tv}%
              </span>
            </div>
          </Row>

          <Row icon={Calendar} title="Décadas" accentBorder={accentBorder} iconBg={tintGradient}>
            <Chips items={dna.decadeDistribution} />
          </Row>

          <Row icon={Globe} title="Países de origen" accentBorder={accentBorder} iconBg={tintGradient}>
            <Chips items={dna.countryDistribution} />
          </Row>

          <Row icon={Languages} title="Idiomas originales" accentBorder={accentBorder} iconBg={tintGradient}>
            <Chips items={dna.languageDistribution} />
          </Row>

          {dna.ratingProfile.label && dna.ratingProfile.average != null && (
            <Row icon={Star} title="Forma de puntuar" accentBorder={accentBorder} iconBg={tintGradient}>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-extrabold text-gradient">{dna.ratingProfile.average.toFixed(1)}</p>
                <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: accentSoft, color: accentText, border: `1px solid ${accentBorder}` }}>
                  {dna.ratingProfile.label}
                </span>
              </div>
            </Row>
          )}

          {dna.tags.length > 0 && (
            <Row icon={Tags} title="Etiquetas" accentBorder={accentBorder} iconBg={tintGradient}>
              <Chips items={dna.tags.map((t) => ({ key: t, label: t, percentage: 0 }))} />
            </Row>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-bold mb-5" style={{ color: "var(--text-secondary)" }}>
            ¿Qué dice tu biblioteca de vos? Descubrilo en Watchly.
          </p>
          <Link to={`/registro?from=${encodeURIComponent(pathname)}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: tintGradient, color: "#fff", boxShadow: `0 4px 18px ${tintGlow}` }}>
            <User className="w-4 h-4" /> Crear mi ADN Audiovisual
          </Link>
        </div>
      </div>
    </div>
  );
}
