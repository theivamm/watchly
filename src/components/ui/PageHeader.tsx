import "@/styles/cinema.css";
import type { ReactNode } from "react";
import { getPosterUrl } from "@/services/tmdb";

export interface HeaderStat { v: ReactNode; l: string; color?: string; onClick?: () => void; active?: boolean }

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  posters?: string[];
  stats?: HeaderStat[];
}

export function PosterWall({ posters }: { posters: string[] }) {
  if (posters.length === 0) return null;
  const cols = 10;
  const items = Array.from({ length: cols * 3 }, (_, i) => posters[i % posters.length]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -inset-[18%] grid gap-3 -rotate-[8deg]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {items.map((p, i) => (
          <img key={i} src={getPosterUrl(p, "w200")} alt="" loading="lazy" className="w-full aspect-[2/3] object-cover rounded-xl" style={{ marginTop: (i % cols) % 2 ? 36 : 0 }} />
        ))}
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.94) 0%, rgba(8,7,14,.72) 38%, rgba(8,7,14,.3) 100%), linear-gradient(180deg, rgba(8,7,14,.25), rgba(8,7,14,.6))" }} />
    </div>
  );
}

export const EDGES = "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4), 0 30px 80px -20px rgba(0,0,0,.6)";

/** Encabezado estándar: banner con muro de portadas, título grande y barra de datos en vidrio. */
export default function PageHeader({ title, eyebrow, subtitle, actions, children, posters = [], stats }: Props) {
  return (
    <header className="relative overflow-hidden rounded-[2.5rem] border border-white/20 mb-8 flex flex-col justify-between gap-8 px-6 md:px-10 pt-8 md:pt-10 pb-6 min-h-[240px]"
      style={{ boxShadow: EDGES, background: posters.length ? undefined : "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))" }}>
      <PosterWall posters={posters} />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && <span className="liquid-glass-sm inline-flex px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest mb-4">{eyebrow}</span>}
          <h1 className="font-cinema text-6xl md:text-8xl leading-[0.95] break-words">{title}</h1>
          {subtitle && <div className="mt-3 text-base md:text-lg font-medium text-white/80 max-w-2xl">{subtitle}</div>}
          {children}
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
      </div>
      {stats && stats.length > 0 && (
        <div className="relative liquid-glass rounded-[2rem] grid [&>*]:px-5 [&>*]:py-4 md:[&>*+*]:border-l [&>*+*]:border-white/15" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 5)}, minmax(0, 1fr))` }}>
          {stats.map((s) => {
            const body = (
              <>
                <p className="font-cinema text-3xl md:text-4xl leading-none truncate">{s.v}</p>
                <p className="text-[11px] font-extrabold uppercase tracking-widest mt-2 text-white/70 inline-flex items-center gap-1.5">
                  {s.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />}{s.l}
                </p>
              </>
            );
            return s.onClick ? (
              <button key={s.l} type="button" onClick={s.onClick} className="text-left min-w-0 transition-colors hover:bg-white/10" style={{ background: s.active ? "rgba(255,255,255,.16)" : undefined }}>{body}</button>
            ) : <div key={s.l} className="min-w-0">{body}</div>;
          })}
        </div>
      )}
    </header>
  );
}
