export type Theme = "dark" | "light" | "system";
export type AccentColor =
  | "coral"
  | "amber"
  | "sunset"
  | "rose"
  | "violet"
  | "aqua"
  | "lime"
  | "sky";

const THEME_KEY = "watchly-theme";
const ACCENT_KEY = "watchly-accent";

export function getStoredTheme(): Theme {
  return "dark";
}

export function getStoredAccent(): AccentColor {
  if (typeof window === "undefined") return "violet";
  return (localStorage.getItem(ACCENT_KEY) as AccentColor) || "violet";
}

export function resolveTheme(_theme: Theme): "dark" | "light" {
  return "dark";
}

export function applyTheme(_theme: Theme): void {
  document.documentElement.setAttribute("data-theme", "dark");
}

export function applyAccent(accent: AccentColor): void {
  document.documentElement.setAttribute("data-accent", accent);
}

export function setStoredTheme(_theme: Theme): void {
  localStorage.setItem(THEME_KEY, "dark");
  applyTheme("dark");
}

export function setStoredAccent(accent: AccentColor): void {
  localStorage.setItem(ACCENT_KEY, accent);
  applyAccent(accent);
}

export function initTheme(): void {
  document.documentElement.setAttribute("data-theme", "dark");
  applyAccent(getStoredAccent());
}
