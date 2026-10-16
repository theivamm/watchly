import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Check, ChevronDown, RotateCw, Search, Shield, Users, Activity, Trash2 } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  deleteUser, getDaily, getErrors, getFunnel, getOverview, getRecentEvents, getTopEvents, getUsers, resolveErrors,
  type AdminDay, type AdminEventCount, type AdminFunnelWeek, type AdminOverview, type AdminUser, type AnalyticsEvent, type ClientError,
} from "@/services/admin";

type Tab = "resumen" | "errores" | "usuarios" | "eventos";

const TABS: { id: Tab; label: string; icon: typeof Shield }[] = [
  { id: "resumen", label: "Resumen", icon: BarChart3 },
  { id: "errores", label: "Errores", icon: AlertTriangle },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "eventos", label: "Eventos", icon: Activity },
];

const EVENT_LABELS: Record<string, string> = {
  search: "Búsqueda", search_failed: "Búsqueda fallida", library_add: "Título agregado", library_write_failed: "Error al guardar",
  login: "Inicio de sesión", login_failed: "Login fallido", sign_up: "Registro", oauth_start: "Inicio con Google",
};

const card = "liquid-glass rounded-[1.75rem] p-6";
const label = "text-[11px] font-extrabold uppercase tracking-widest text-white/55";
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export default function AdminPage() {
  usePageTitle("Admin | Watchly");
  const [tab, setTab] = useState<Tab>("resumen");

  return (
    <div className="w-full text-white px-5 md:px-10 pt-8 pb-24 max-w-[1300px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-white/60"><Shield className="w-4 h-4" /> Super admin</p>
          <h1 className="font-cinema text-5xl md:text-6xl leading-none mt-2">Panel de control</h1>
        </div>
        <nav className="liquid-glass-sm flex rounded-full p-1 overflow-x-auto no-scrollbar max-w-full" role="tablist">
          {TABS.map(({ id, label: l, icon: Icon }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-extrabold whitespace-nowrap transition-colors"
              style={tab === id ? { background: "#fff", color: "#111" } : { color: "rgba(255,255,255,.8)" }}>
              <Icon className="w-4 h-4" /> {l}
            </button>
          ))}
        </nav>
      </header>
      {tab === "resumen" && <OverviewTab />}
      {tab === "errores" && <ErrorsTab />}
      {tab === "usuarios" && <UsersTab />}
      {tab === "eventos" && <EventsTab />}
    </div>
  );
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [n, setN] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    fn().then((d) => { if (!cancelled) setData(d); }).catch((e) => { if (!cancelled) setError(e?.message ?? "Error"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { data, error, reload: () => setN((x) => x + 1) };
}

function Loading({ error }: { error?: string }) {
  if (error) return <p className="text-sm font-bold text-red-300 py-10 text-center">No se pudo cargar: {error}</p>;
  return <div className="flex justify-center py-16"><RotateCw className="w-6 h-6 animate-spin text-white/50" /></div>;
}

/* ───────────────────────── Resumen ───────────────────────── */

const METRICS: { key: keyof Omit<AdminDay, "day">; label: string }[] = [
  { key: "active_users", label: "Usuarios activos" },
  { key: "signups", label: "Registros" },
  { key: "titles_added", label: "Títulos agregados" },
  { key: "errors", label: "Errores" },
];

function OverviewTab() {
  const ov = useLoad(getOverview);
  const daily = useLoad(() => getDaily(30));
  const funnel = useLoad(getFunnel);
  const top = useLoad(() => getTopEvents(7));

  if (!ov.data) return <Loading error={ov.error} />;
  const o: AdminOverview = ov.data;
  const tiles = [
    { l: "Usuarios", v: o.users_total, s: `+${o.users_7d} en 7 días` },
    { l: "Activos 7 días", v: o.active_7d, s: `${pct(o.active_7d, o.users_total)}% del total` },
    { l: "Títulos guardados", v: o.entries_total, s: `+${o.library_add_7d} en 7 días` },
    { l: "ADN calculados", v: o.dna_total, s: `${pct(o.dna_total, o.users_total)}% de usuarios` },
    { l: "Búsquedas 7 días", v: o.searches_7d, s: o.search_ms_p50_7d != null ? `mediana ${Math.round(o.search_ms_p50_7d)} ms` : "sin datos de tiempo" },
    { l: "Fallas al guardar 7d", v: o.write_fail_7d, s: o.write_fail_7d === 0 ? "Todo bien" : "Revisar errores", warn: o.write_fail_7d > 0 },
    { l: "Errores 24 h", v: o.errors_24h, s: `${o.errors_open} distintos sin resolver`, warn: o.errors_open > 0 },
    { l: "Listas · Sesiones", v: o.lists_total, s: `${o.sessions_total} sesiones de visualización` },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.l} className={card}>
            <p className={label}>{t.l}</p>
            <p className="font-cinema text-5xl leading-none mt-3">{t.v.toLocaleString("es-AR")}</p>
            <p className={`text-xs font-bold mt-2 ${t.warn ? "text-amber-300" : "text-white/60"}`}>
              {t.warn && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}{t.s}
            </p>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        <div className={card}>{daily.data ? <DailyChart days={daily.data} /> : <Loading error={daily.error} />}</div>
        <div className={card}>
          <p className={label}>Activación (total)</p>
          <FunnelBars steps={[
            { l: "Registrados", v: o.users_total },
            { l: "Email confirmado", v: o.users_confirmed },
            { l: "Onboarding completo", v: o.onboarded },
            { l: "Primer título", v: o.with_titles },
            { l: "ADN calculado", v: o.dna_total },
          ]} />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className={card}>
          <p className={`${label} mb-4`}>Embudo por semana de registro</p>
          {!funnel.data ? <Loading error={funnel.error} /> : funnel.data.length === 0 ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-white/55 text-xs">
                  <th className="py-2 font-bold">Semana</th><th className="font-bold text-right">Registros</th>
                  <th className="font-bold text-right">Onboarding</th><th className="font-bold text-right">1er título</th>
                </tr></thead>
                <tbody>
                  {funnel.data.map((w: AdminFunnelWeek) => (
                    <tr key={w.week} className="border-t border-white/10">
                      <td className="py-2.5 font-bold">{new Date(w.week + "T00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</td>
                      <td className="text-right tabular-nums">{w.signups}</td>
                      <td className="text-right tabular-nums">{w.onboarded} <span className="text-white/45">({pct(w.onboarded, w.signups)}%)</span></td>
                      <td className="text-right tabular-nums">{w.first_title} <span className="text-white/45">({pct(w.first_title, w.signups)}%)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className={card}>
          <p className={`${label} mb-4`}>Eventos · últimos 7 días</p>
          {!top.data ? <Loading error={top.error} /> : top.data.length === 0 ? <Empty text="Todavía no hay eventos. Se registran solo en producción." /> : (
            <ul className="space-y-2.5">
              {top.data.map((e: AdminEventCount) => (
                <li key={e.event} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold truncate">{EVENT_LABELS[e.event] ?? e.event}</span>
                  <span className="tabular-nums text-white/70 shrink-0">{e.total} <span className="text-white/45">· {e.users} usuarios</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function DailyChart({ days }: { days: AdminDay[] }) {
  const [metric, setMetric] = useState<(typeof METRICS)[number]["key"]>("active_users");
  const [hover, setHover] = useState<number | null>(null);
  const values = days.map((d) => Number(d[metric]));
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const focus = hover != null ? days[hover] : null;
  const fmt = (s: string) => new Date(s + "T00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short" });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={label}>Últimos 30 días</p>
        <div className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button key={m.key} type="button" onClick={() => setMetric(m.key)}
              className="h-8 px-3 rounded-full text-xs font-extrabold transition-colors"
              style={metric === m.key ? { background: "#fff", color: "#111" } : { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.8)" }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-4 text-sm h-5 text-white/80" aria-live="polite">
        {focus
          ? <><span className="font-extrabold text-white">{fmt(focus.day)}</span> · {Number(focus[metric])} {METRICS.find((m) => m.key === metric)!.label.toLowerCase()}</>
          : <>Total del período: <span className="font-extrabold text-white">{total}</span></>}
      </p>
      <div className="relative mt-3 h-44" onMouseLeave={() => setHover(null)}>
        <div className="absolute inset-x-0 bottom-0 border-t border-white/15" />
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
        <span className="absolute -top-2 right-0 text-[10px] text-white/45 tabular-nums">{max}</span>
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {days.map((d, i) => {
            const v = values[i];
            return (
              <button key={d.day} type="button" aria-label={`${fmt(d.day)}: ${v}`}
                onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onClick={() => setHover(i)}
                className="flex-1 h-full flex items-end group">
                <span className="w-full rounded-t-[4px] transition-opacity"
                  style={{ height: v > 0 ? `max(3px, ${(v / max) * 100}%)` : "0", background: "var(--accent-light, #c4b5fd)", opacity: hover == null || hover === i ? 1 : 0.4 }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-white/45 mt-2 tabular-nums">
        <span>{fmt(days[0].day)}</span><span>{fmt(days[days.length - 1].day)}</span>
      </div>
    </div>
  );
}

function FunnelBars({ steps }: { steps: { l: string; v: number }[] }) {
  const top = Math.max(1, steps[0].v);
  return (
    <ul className="mt-5 space-y-3.5">
      {steps.map((s) => (
        <li key={s.l}>
          <div className="flex justify-between text-sm"><span className="font-bold">{s.l}</span>
            <span className="tabular-nums text-white/70">{s.v} <span className="text-white/45">· {pct(s.v, top)}%</span></span></div>
          <div className="h-2 rounded-full bg-white/10 mt-1.5 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct(s.v, top)}%`, background: "var(--accent-light, #c4b5fd)" }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text = "Sin datos todavía." }: { text?: string }) {
  return <p className="text-sm text-white/55 py-6 text-center">{text}</p>;
}

/* ───────────────────────── Errores ───────────────────────── */

function ErrorsTab() {
  const [showResolved, setShowResolved] = useState(false);
  const { data, error, reload } = useLoad(() => getErrors(showResolved), [showResolved]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, ClientError[]>();
    for (const e of data ?? []) map.set(e.message, [...(map.get(e.message) ?? []), e]);
    return [...map.entries()].map(([message, items]) => ({
      message, items, last: items[0], users: new Set(items.map((i) => i.user_id).filter(Boolean)).size,
      paths: [...new Set(items.map((i) => i.path).filter(Boolean))].slice(0, 4),
      resolved: items.every((i) => i.resolved_at),
    }));
  }, [data]);

  const resolve = async (message: string) => {
    setBusy(message);
    try { await resolveErrors(message); reload(); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/70">{groups.length} errores distintos {showResolved ? "(incluye resueltos)" : "sin resolver"}</p>
        <label className="inline-flex items-center gap-2 text-sm font-bold cursor-pointer">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="accent-white w-4 h-4" />
          Mostrar resueltos
        </label>
      </div>
      {!data ? <Loading error={error} /> : groups.length === 0 ? (
        <div className={`${card} text-center py-12`}><Check className="w-8 h-8 mx-auto text-emerald-300" /><p className="font-extrabold mt-3">Sin errores pendientes</p></div>
      ) : groups.map((g) => (
        <div key={g.message} className={`${card} !p-0 overflow-hidden`}>
          <button type="button" onClick={() => setOpen(open === g.message ? null : g.message)} className="w-full text-left p-5 flex items-start gap-4">
            <span className="shrink-0 mt-0.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-white/10">{g.last.source}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-sm break-words">{g.message}</span>
              <span className="block text-xs text-white/55 mt-1.5">
                {g.items.length} {g.items.length === 1 ? "vez" : "veces"} · {g.users} {g.users === 1 ? "usuario" : "usuarios"} · último {fmtDate(g.last.created_at)}
                {g.resolved && " · resuelto"}
              </span>
            </span>
            <ChevronDown className={`w-4 h-4 shrink-0 mt-1 transition-transform ${open === g.message ? "rotate-180" : ""}`} />
          </button>
          {open === g.message && (
            <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
              {g.paths.length > 0 && <p className="text-xs text-white/70"><span className="font-extrabold">Páginas:</span> {g.paths.join(", ")}</p>}
              {g.last.user_agent && <p className="text-xs text-white/55 break-words"><span className="font-extrabold text-white/70">Navegador:</span> {g.last.user_agent}</p>}
              {g.last.stack && <pre className="text-[11px] leading-relaxed bg-black/40 rounded-xl p-3 overflow-x-auto max-h-64 text-white/80">{g.last.stack}</pre>}
              {!g.resolved && (
                <button type="button" onClick={() => resolve(g.message)} disabled={busy === g.message}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-white text-[#111] text-sm font-extrabold disabled:opacity-60">
                  {busy === g.message ? <RotateCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Marcar como resuelto
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────── Usuarios ───────────────────────── */

function UsersTab() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  const { data, error, reload } = useLoad(() => getUsers(query), [query]);
  const [toDelete, setToDelete] = useState<AdminUser | null>(null);
  const [deletedMsg, setDeletedMsg] = useState("");

  return (
    <div className="space-y-4">
      <label className="liquid-glass-sm flex items-center gap-3 h-12 rounded-full px-5 max-w-md">
        <Search className="w-4 h-4 text-white/60" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por email, usuario o nombre…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/45" />
      </label>
      {deletedMsg && <p className="text-sm font-bold text-emerald-300 animate-pop">{deletedMsg}</p>}
      {toDelete && (
        <DeleteUserDialog user={toDelete} onClose={() => setToDelete(null)}
          onDeleted={() => { setDeletedMsg(`Se eliminó ${toDelete.email}.`); setToDelete(null); reload(); }} />
      )}
      {!data ? <Loading error={error} /> : data.length === 0 ? <Empty text="Sin resultados." /> : (
        <div className={`${card} !p-0 overflow-x-auto`}>
          <table className="w-full text-sm min-w-[760px]">
            <thead><tr className="text-left text-white/55 text-xs">
              <th className="px-5 py-3 font-bold">Usuario</th><th className="font-bold">Alta</th><th className="font-bold">Último ingreso</th>
              <th className="font-bold text-right">Títulos</th><th className="font-bold px-5">Estado</th><th className="sr-only">Acciones</th>
            </tr></thead>
            <tbody>
              {data.map((u: AdminUser) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-5 py-3">
                    <p className="font-bold">{u.display_name || "—"} {u.username && <a href={`/perfil/${u.username}`} className="text-white/55 font-semibold hover:text-white">@{u.username}</a>}</p>
                    <p className="text-xs text-white/55">{u.email}</p>
                  </td>
                  <td className="text-white/75 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                  <td className="text-white/75 whitespace-nowrap">{fmtDate(u.last_sign_in_at)}</td>
                  <td className="text-right tabular-nums">{u.entries}</td>
                  <td className="px-5">
                    <div className="flex flex-wrap gap-1.5">
                      {u.is_admin && <Badge tone="violet">Admin</Badge>}
                      {!u.confirmed && <Badge tone="amber">Sin confirmar</Badge>}
                      {u.has_dna && <Badge>ADN</Badge>}
                      {u.provider !== "email" && <Badge>{u.provider}</Badge>}
                    </div>
                  </td>
                  <td className="pr-5 text-right">
                    {!u.is_admin && (
                      <button type="button" onClick={() => { setDeletedMsg(""); setToDelete(u); }} title="Eliminar usuario" aria-label={`Eliminar ${u.email}`}
                        className="w-9 h-9 rounded-full inline-flex items-center justify-center text-red-300 hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeleteUserDialog({ user, onClose, onDeleted }: { user: AdminUser; onClose: () => void; onDeleted: () => void }) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ok = typed.trim().toLowerCase() === user.email.toLowerCase();

  const confirm = async () => {
    if (!ok) return;
    setBusy(true);
    setErr("");
    try {
      await deleteUser(user.id);
      onDeleted();
    } catch (e) {
      setErr((e as { message?: string })?.message || "No se pudo eliminar.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70" onClick={busy ? undefined : onClose} role="dialog" aria-modal="true">
      <div className="liquid-glass rounded-[2rem] p-7 w-full max-w-md animate-pop" onClick={(e) => e.stopPropagation()}>
        <span className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-300" /></span>
        <h2 className="font-cinema text-4xl leading-none mt-5">Eliminar usuario</h2>
        <p className="text-sm text-white/75 mt-3 leading-relaxed">
          Se va a borrar <strong className="text-white">{user.email}</strong>
          {user.username && <> (@{user.username})</>} junto con su perfil, sus {user.entries} títulos, listas, sesiones y ADN.
          <strong className="text-red-300"> No se puede deshacer.</strong>
        </p>
        <label className="block mt-5">
          <span className="text-xs font-bold text-white/70">Escribí el email para confirmar</span>
          <input autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirm()}
            placeholder={user.email} className="mt-2 w-full h-12 rounded-full px-5 bg-white/10 border border-white/15 outline-none focus:border-white/40 text-sm" />
        </label>
        {err && <p className="text-xs font-bold text-red-300 mt-3">{err}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} disabled={busy} className="liquid-glass-sm flex-1 h-12 rounded-full text-sm font-bold">Cancelar</button>
          <button type="button" onClick={confirm} disabled={!ok || busy}
            className="flex-1 h-12 rounded-full text-sm font-extrabold bg-red-500 text-white inline-flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity">
            {busy ? <RotateCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "violet" | "amber" }) {
  const style = tone === "violet" ? { background: "#c4b5fd", color: "#1e1b4b" } : tone === "amber" ? { background: "#fcd34d", color: "#422006" } : { background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)" };
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide" style={style}>{children}</span>;
}

/* ───────────────────────── Eventos ───────────────────────── */

function EventsTab() {
  const { data, error, reload } = useLoad(getRecentEvents);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">Últimos 200 eventos</p>
        <button type="button" onClick={reload} className="liquid-glass-sm inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-bold"><RotateCw className="w-4 h-4" /> Actualizar</button>
      </div>
      {!data ? <Loading error={error} /> : data.length === 0 ? <Empty text="Todavía no hay eventos. Se registran solo en producción." /> : (
        <div className={`${card} !p-0 overflow-x-auto`}>
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-white/55 text-xs">
              <th className="px-5 py-3 font-bold">Cuándo</th><th className="font-bold">Evento</th><th className="font-bold">Página</th><th className="font-bold px-5">Datos</th>
            </tr></thead>
            <tbody>
              {data.map((e: AnalyticsEvent) => (
                <tr key={e.id} className="border-t border-white/10">
                  <td className="px-5 py-2.5 whitespace-nowrap text-white/75">{fmtDate(e.created_at)}</td>
                  <td className="font-bold whitespace-nowrap">{EVENT_LABELS[e.event] ?? e.event}</td>
                  <td className="text-white/65">{e.path ?? "—"}</td>
                  <td className="px-5 text-xs text-white/55 font-mono break-all">{Object.keys(e.props ?? {}).length ? JSON.stringify(e.props) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
