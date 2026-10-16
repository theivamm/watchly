import { supabase } from "@/lib/supabase";

type ErrorSource = "window" | "promise" | "react" | "api";

const sessionId = (() => {
  try {
    const k = "watchly_sid";
    const existing = sessionStorage.getItem(k);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(k, id);
    return id;
  } catch {
    return null;
  }
})();

const enabled = import.meta.env.PROD || import.meta.env.VITE_TELEMETRY_DEV === "true";
const MAX_ERRORS_PER_SESSION = 20;
let errorCount = 0;
const seenErrors = new Set<string>();

export function track(event: string, props: Record<string, unknown> = {}): void {
  if (!enabled) return;
  supabase
    .from("analytics_events")
    .insert({ event, props, session_id: sessionId, path: location.pathname })
    .then(({ error }) => { if (error) console.warn("track failed", error.message); });
}

export function logError(source: ErrorSource, err: unknown): void {
  const e = err instanceof Error ? err : new Error(typeof err === "string" ? err : JSON.stringify(err));
  if (!enabled) return;
  const key = `${source}:${e.message}`;
  if (seenErrors.has(key) || errorCount >= MAX_ERRORS_PER_SESSION) return;
  seenErrors.add(key);
  errorCount++;
  supabase
    .from("client_errors")
    .insert({
      source,
      message: e.message.slice(0, 1000),
      stack: e.stack?.slice(0, 4000) ?? null,
      session_id: sessionId,
      path: location.pathname.slice(0, 512),
      user_agent: navigator.userAgent.slice(0, 400),
    })
    .then(() => {});
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener("error", (ev) => {
    // Extensiones del navegador (p. ej. MetaMask) inyectan scripts que no son nuestros.
    if (ev.filename && !ev.filename.startsWith(location.origin)) return;
    logError("window", ev.error ?? ev.message);
  });
  window.addEventListener("unhandledrejection", (ev) => logError("promise", ev.reason));
}
