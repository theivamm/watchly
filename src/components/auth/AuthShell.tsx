import type { ReactNode } from "react";
import { useRandomCovers } from "@/hooks/useRandomCovers";
import PublicNav from "@/components/layout/PublicNav";
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
  const items = useRandomCovers(8);
  const hero = useHeroCycle(items.map((i) => i.posterPath), 7000);
  const active = items[hero.index];

  return (
    <div className="relative min-h-screen overflow-hidden text-white flex flex-col">
      <HeroBackdrop chroma items={items} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

      <PublicNav back={back} />

      <main className="relative z-10 flex-1 flex items-center justify-between gap-12 px-5 md:px-14 lg:px-24 py-10">
        <div className="hidden lg:block max-w-[640px]">
          <span className="liquid-glass-sm inline-flex px-[18px] py-2 rounded-full text-xs font-extrabold tracking-[.2em] uppercase">
            Tu mundo de cine
          </span>
          <p className="font-cinema mt-7 text-7xl xl:text-[7rem] leading-[1.02] drop-shadow-[0_10px_60px_rgba(0,0,0,.4)]">
            Tu historial<br />
            <span style={{ color: "#fff" }}>de cine.</span>
          </p>
          {active && (
            <p className="mt-8 text-sm font-bold text-white/70">
              En tendencia · <span className="text-white">{active.title}</span>
            </p>
          )}
        </div>

        <div className="w-full max-w-[460px] mx-auto lg:mx-0 shrink-0">
          <div className="liquid-glass rounded-[2.5rem] p-8 md:p-10" style={{ boxShadow: "inset 3px 0 0 rgba(255,80,140,.45), inset -3px 0 0 rgba(70,170,255,.45), inset 0 1px 0 rgba(255,255,255,.5), 0 30px 80px -20px rgba(0,0,0,.7)" }}>
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
