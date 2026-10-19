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

/** Encabezado estándar: portadas de fondo, texto centrado en mobile y datos en una fila sin cajas. */
export default function PageHeader({ title, eyebrow, subtitle, actions, children, posters = [], stats }: Props) {
  return (
    <header className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/20 mb-8 flex flex-col justify-between gap-7 px-5 md:px-10 pt-9 md:pt-10 pb-6 min-h-[240px] text-center md:text-left"
      style={{ boxShadow: EDGES, background: posters.length ? undefined : "linear-gradient(135deg, rgba(255,255,255,.1), rgba(255,255,255,.03))" }}>
      <PosterWall posters={posters} />
      <div aria-hidden="true" className="absolute inset-0 md:hidden pointer-events-none" style={{ background: "radial-gradient(90% 70% at 50% 40%, rgba(8,7,14,.55), rgba(8,7,14,.2))" }} />
      <div className="relative flex flex-col md:flex-row md:flex-wrap items-center md:items-start md:justify-between gap-5">
        <div className="min-w-0 w-full md:w-auto flex flex-col items-center md:items-start">
          {eyebrow && (
            <span className="inline-flex items-center gap-3 text-[11px] md:text-xs font-extrabold uppercase tracking-[.22em] text-white/80 mb-4">
              <span className="h-px w-6 bg-white/40 md:hidden" />{eyebrow}<span className="h-px w-6 bg-white/40" />
            </span>
          )}
          <h1 className="font-cinema text-5xl sm:text-6xl md:text-8xl leading-[0.95] [overflow-wrap:anywhere] [text-wrap:balance]">{title}</h1>
          {subtitle && <div className="mt-3 text-sm md:text-lg font-medium text-white/80 max-w-2xl text-pretty">{subtitle}</div>}
          {children}
        </div>
        {actions && <div className="flex items-center justify-center gap-2.5 flex-wrap">{actions}</div>}
      </div>
      {stats && stats.length > 0 && (
        <div className="relative flex flex-wrap justify-center border-t border-white/20 pt-5 gap-y-4">
          {stats.map((s, i) => {
            const body = (
              <>
                <p className="font-cinema text-3xl md:text-4xl leading-none">{s.v}</p>
                <p className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider mt-2 text-white/75 inline-flex items-start justify-center gap-1.5 leading-tight">
                  {s.color && <span className="w-2 h-2 rounded-full shrink-0 mt-[1px]" style={{ background: s.color }} />}{s.l}
                </p>
              </>
            );
            const cls = `basis-1/3 md:basis-0 md:flex-1 min-w-0 px-1 text-center ${i ? "md:border-l md:border-white/15" : ""}`;
            return s.onClick ? (
              <button key={s.l} type="button" onClick={s.onClick} className={`${cls} rounded-2xl py-2 transition-colors hover:bg-white/10`} style={{ background: s.active ? "rgba(255,255,255,.16)" : undefined }}>{body}</button>
            ) : <div key={s.l} className={`${cls} py-2`}>{body}</div>;
          })}
        </div>
      )}
    </header>
  );
}
