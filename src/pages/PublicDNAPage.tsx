import "@/styles/cinema.css";
import { useEffect, useState, type CSSProperties } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Sparkles, User, Lock, AlertTriangle, ArrowLeft } from "lucide-react";
import { getProfileByUsername } from "@/services/profile";
import { getPublicDnaByUsername } from "@/services/dna";
import UserMenu from "@/components/layout/UserMenu";
import { AmbientLayer, useAmbient } from "@/components/layout/AmbientBackground";
import DNAView from "@/components/dna/DNAView";
import type { Profile, UserDNA } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

const whiteBtn = "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]";

export default function PublicDNAPage() {
  const { username = "" } = useParams();
  const { pathname } = useLocation();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  usePageTitle(`ADN Audiovisual de ${profile?.display_name || `@${username}`} | Watchly`);
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [loaded, setLoaded] = useState(false);
  const amb = useAmbient();

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
        } else if (!cancelled) {
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProfile(null);
          setLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, [username]);

  const frame = (children: React.ReactNode) => (
    <div className="relative min-h-screen text-white" style={amb.vars as CSSProperties}>
      <AmbientLayer items={amb.items} index={amb.index} />
      {children}
    </div>
  );

  if (!loaded) {
    return frame(
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>,
    );
  }

  const center = (icon: React.ReactNode, title: string, body: string, cta?: React.ReactNode) =>
    frame(
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="liquid-glass rounded-[2.75rem] px-10 py-12 max-w-md text-center">
          <div className="liquid-glass-sm w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center">{icon}</div>
          <h1 className="font-cinema text-5xl leading-none mb-3">{title}</h1>
          <p className="text-sm mb-7 text-white/75">{body}</p>
          {cta}
        </div>
      </div>,
    );

  if (profile == null) {
    return center(<AlertTriangle className="w-9 h-9" />, "Perfil no encontrado", "Este perfil no existe o cambió su usuario.", <Link to="/" className={whiteBtn}>Ir a Watchly</Link>);
  }
  if (!profile.is_profile_public || !profile.show_dna_publicly) {
    return center(<Lock className="w-9 h-9" />, "ADN privado", `${profile.display_name || profile.username} no comparte su ADN Audiovisual.`, <Link to={`/perfil/${username}`} className={whiteBtn}>Ver perfil</Link>);
  }
  if (!dna || dna.status === "locked") {
    return center(<Sparkles className="w-9 h-9" />, "Su ADN sigue tomando forma", `${profile.display_name || profile.username} todavía no alcanzó los títulos suficientes para mostrar su ADN.`, <Link to={`/perfil/${username}`} className={whiteBtn}>Ver perfil</Link>);
  }

  return frame(
    <>
      <div className="fixed top-4 right-4 z-50"><UserMenu /></div>
      <div className="relative w-full px-5 md:px-10 py-8 md:py-12 max-w-[1400px] mx-auto">
        <Link to={`/perfil/${profile.username}`} className="liquid-glass-sm inline-flex items-center gap-2 h-11 px-5 rounded-full text-xs font-extrabold text-white hover:text-white mb-6 transition-transform hover:scale-[1.03]">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al perfil de {profile.display_name || profile.username}
        </Link>

        <DNAView dna={dna} title={profile.display_name || profile.username} owner={profile.username} />

        <div className="mt-12 text-center">
          <p className="text-sm font-bold mb-5 text-white/75">¿Qué dice tu biblioteca de vos? Descubrilo en Watchly.</p>
          <Link to={`/registro?from=${encodeURIComponent(pathname)}`} className={whiteBtn}><User className="w-4 h-4" /> Crear mi ADN Audiovisual</Link>
        </div>
      </div>
    </>,
  );
}
