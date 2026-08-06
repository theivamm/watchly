import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Sparkles, Clapperboard, Tv, Calendar, Globe, Languages, Star,
  Tags, ShieldCheck, User, Lock, AlertTriangle,
} from "lucide-react";
import { getProfileByUsername } from "@/services/profile";
import { getPublicDnaByUsername } from "@/services/dna";
import type { Profile, UserDNA } from "@/types";
import { GenreLegend } from "@/components/dna/GenreFingerprint";

function Row({ icon: Icon, title, children }: {
  icon: typeof Star;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border p-6"
      style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 18%, transparent)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 14px color-mix(in srgb, var(--accent) 40%, transparent)" }}>
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
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setProfile(undefined);
    setDna(null);
    setLoaded(false);
    getProfileByUsername(username)
      .then(async (p) => {
        if (cancelled) return;
        setProfile(p);
        if (p && p.is_profile_public && p.show_dna_publicly) {
          const d = await getPublicDnaByUsername(username).catch(() => null);
          if (!cancelled) {
            setDna(d);
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
    <div className="w-full px-5 md:px-8 py-8 md:py-12 max-w-5xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] border p-7 md:p-10 mb-8 text-center"
        style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)" }}>
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full blur-[110px] animate-glow pointer-events-none"
          style={{ background: "color-mix(in srgb, var(--accent) 35%, transparent)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
            <Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-1 text-gradient">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm font-bold mb-4" style={{ color: "var(--accent-light)" }}>@{profile.username}</p>
          {dna.summary && (
            <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-6" style={{ color: "var(--text-primary)" }}>
              {dna.summary}
            </p>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: "var(--accent-light)" }} />
            Calculado con {dna.validTitleCount} títulos
          </div>
        </div>
      </div>

      {dna.topGenres.length > 0 && (
        <div className="rounded-3xl border p-6 md:p-8 mb-6"
          style={{ backgroundColor: "var(--surface-1)", borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)" }}>
          <h2 className="text-lg font-extrabold tracking-tight mb-6" style={{ color: "var(--text-primary)" }}>
            Géneros principales
          </h2>
          <GenreLegend genres={dna.topGenres} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Row icon={Clapperboard} title="Películas vs series">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
              <Clapperboard className="w-3.5 h-3.5" /> {dna.formatDistribution.movie}%
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-bold"
              style={{ backgroundColor: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <Tv className="w-3.5 h-3.5" /> {dna.formatDistribution.tv}%
            </span>
          </div>
        </Row>

        <Row icon={Calendar} title="Décadas">
          <Chips items={dna.decadeDistribution} />
        </Row>

        <Row icon={Globe} title="Países de origen">
          <Chips items={dna.countryDistribution} />
        </Row>

        <Row icon={Languages} title="Idiomas originales">
          <Chips items={dna.languageDistribution} />
        </Row>

        {dna.ratingProfile.label && dna.ratingProfile.average != null && (
          <Row icon={Star} title="Forma de puntuar">
            <div className="flex items-center gap-4">
              <p className="text-3xl font-extrabold text-gradient">{dna.ratingProfile.average.toFixed(1)}</p>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                {dna.ratingProfile.label}
              </span>
            </div>
          </Row>
        )}

        {dna.tags.length > 0 && (
          <Row icon={Tags} title="Etiquetas">
            <Chips items={dna.tags.map((t) => ({ key: t, label: t, percentage: 0 }))} />
          </Row>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm font-bold mb-5" style={{ color: "var(--text-secondary)" }}>
          ¿Qué dice tu biblioteca de vos? Descubrilo en Watchly.
        </p>
        <Link to="/registro"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "var(--gradient-accent)", color: "#fff", boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
          <User className="w-4 h-4" /> Crear mi ADN Audiovisual
        </Link>
      </div>
    </div>
  );
}
