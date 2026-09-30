import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTrending } from "@/hooks/useMedia";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import HeroBackdrop from "@/components/home/HeroBackdrop";

interface Props {
  title: string;
  subtitle: string;
  back?: string | null;
  footer?: ReactNode;
  children: ReactNode;
}

/** Marco cinematográfico compartido por login / registro / recuperar contraseña. */
export default function AuthShell({ title, subtitle, back, footer, children }: Props) {
  const { data } = useTrending("all");
  const items = (data?.results || []).filter((i) => i.posterPath && i.backdropPath).slice(0, 5);
  const hero = useHeroCycle(items.map((i) => i.posterPath));
  const active = items[hero.index];

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex flex-col">
      <HeroBackdrop items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

      <header className="relative z-10 flex items-center justify-between px-5 md:px-10 pt-6">
        <Link to="/" className="liquid-glass h-14 px-7 rounded-full flex items-center font-cinema text-3xl text-white hover:text-white"
          style={{ color: hero.accent, transition: "color 1.2s" }}>
          Watchly
        </Link>
        {back && (
          <Link to={back} className="liquid-glass-sm h-12 px-5 rounded-full flex items-center gap-2 text-sm font-bold text-white hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
        )}
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-between gap-12 px-5 md:px-14 lg:px-24 py-10">
        <div className="hidden lg:block max-w-[640px]">
          <span className="liquid-glass-sm inline-flex px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase">
            Tu mundo de cine
          </span>
          <p className="font-cinema mt-7 text-7xl xl:text-[7rem] leading-[1.02] drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
            Tu historial<br />
            <span style={{ color: hero.accent, transition: "color 1.2s" }}>de cine.</span>
          </p>
          {active && (
            <p className="mt-8 text-sm font-bold text-white/70">
              En tendencia · <span className="text-white">{active.title}</span>
            </p>
          )}
        </div>

        <div className="w-full max-w-[460px] mx-auto lg:mx-0 shrink-0">
          <div className="liquid-glass rounded-[2.5rem] p-8 md:p-10">
            <h1 className="font-cinema text-5xl leading-none">{title}</h1>
            <p className="text-sm text-white/70 mt-3 mb-8">{subtitle}</p>
            {children}
          </div>
          {footer && <div className="text-center mt-6 text-sm text-white/70">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
