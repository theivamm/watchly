import "@/styles/cinema.css";
import { accentVars } from "@/lib/tone";

const ambient = { items: [], index: 0, hue: 265, vars: accentVars(265) };

/** Stable palette: changing inherited variables repaints every glass surface. */
export function useAmbient() { return ambient; }

export function AmbientLayer(_props: { items: typeof ambient.items; index: number }) {
  return <div aria-hidden="true" className="fixed inset-0 -z-10 pointer-events-none" style={{
    background: "radial-gradient(ellipse at 15% 10%, #29203f 0%, transparent 60%), radial-gradient(ellipse at 85% 75%, #152b37 0%, transparent 55%), #07070d",
  }} />;
}
