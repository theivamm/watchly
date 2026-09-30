import "@/styles/cinema.css";
import type { ReactNode } from "react";

interface Props {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/** Encabezado estándar de las páginas internas. */
export default function PageHeader({ title, eyebrow, subtitle, actions, children }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-5 mb-9">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-extrabold tracking-[.25em] uppercase text-white/60 mb-3">{eyebrow}</p>}
        <h1 className="font-cinema text-5xl md:text-7xl leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,.4)]">{title}</h1>
        {subtitle && <div className="mt-3 text-sm md:text-base font-medium text-white/70">{subtitle}</div>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </header>
  );
}
