import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Shuffle, Clock, Check, ArrowRight, Bookmark, Compass } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { usePageTitle } from "@/hooks/usePageTitle";
import { getEntry, getUserLibrary, updateEntry } from "@/services/library";
import { loadTonightCandidates } from "@/services/tonight";
import { getPosterUrl } from "@/services/tmdb";
import { eligibleEntry, pickTonight, tonightModes } from "@/lib/watchTonight";
import type { TonightCandidate, TonightFilters } from "@/lib/watchTonight";
import type { Entry, TMDBSearchResult } from "@/types";
import { track } from "@/lib/telemetry";
import DnaDiscovery from "@/components/home/DnaDiscovery";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import PageHeader, { EDGES } from "@/components/ui/PageHeader";

const initialFilters: TonightFilters = { mode: "surprise", format: "all", minutes: null, avoidHorror: false };
const button = "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full liquid-glass-sm text-sm font-extrabold text-white hover:text-white transition-transform hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed";
type Choice = ReturnType<typeof pickTonight>[number];

export default function WatchTonightPage() {
  const { user } = useAuth();
  return <TonightExperience key={user?.id} />;
}

function TonightExperience() {
  usePageTitle("¿Qué vemos hoy? | Watchly");
  const { user } = useAuth();
  const userId = user?.id;
  const [source, setSource] = useState<"library" | "dna">("library");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [filters, setFilters] = useState<TonightFilters>(initialFilters);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<TonightCandidate[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [searched, setSearched] = useState(false);
  const [accepted, setAccepted] = useState<Choice | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<TMDBSearchResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  const session = useRef<{ id: string; started: number } | null>(null);
  const savingRef = useRef(false);
  const resultRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(false);
    setEntries([]);
    if (userId) getUserLibrary(userId).then((data) => {
      if (alive) setEntries(data);
    }).catch(() => { if (alive) setLoadError(true); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; controller.current?.abort(); };
  }, [userId, retry]);

  const event = (name: string, props: Record<string, unknown> = {}) => {
    track(`tonight_${name}`, { decision_id: session.current?.id, mode: filters.mode, format: filters.format, minutes: filters.minutes, avoid_horror: filters.avoidHorror, ...props });
  };
  const resetResults = () => {
    controller.current?.abort();
    setBusy(false); setSearched(false); setChoices([]); setCandidates([]);
    setAccepted(null); setSaved(false); setError("");
    session.current = null;
  };
  const changeFilters = (next: TonightFilters) => { resetResults(); setFilters(next); };
  const show = (pool: TonightCandidate[], excluded: Set<string>) => {
    const next = pickTonight(pool, filters, excluded);
    setChoices(next);
    setSearched(true);
    setAccepted(null);
    setSaved(false);
    if (next.length) event("suggested", { entry_ids: next.map((item) => item.entry.id) });
    else event("empty", { excluded: excluded.size });
    requestAnimationFrame(() => resultRef.current?.focus());
  };
  const start = async () => {
    if (busy || savingRef.current) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    session.current = { id: crypto.randomUUID(), started: Date.now() };
    event("started");
    setBusy(true); setProgress(0); setError(""); setSearched(false); setAccepted(null); setSaved(false);
    const pool = await loadTonightCandidates(entries.filter((entry) => eligibleEntry(entry, filters)), abort.signal, setProgress);
    if (abort.signal.aborted) return;
    setCandidates(pool); setBusy(false); show(pool, dismissed);
  };
  const accept = (choice: Choice) => {
    if (accepted) return;
    setAccepted(choice);
    event("accepted", { entry_id: choice.entry.id, elapsed_ms: Date.now() - (session.current?.started ?? Date.now()) });
  };
  const markWatching = async () => {
    if (!accepted || !user || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError("");
    try {
      const current = await getEntry(user.id, accepted.entry.tmdb_id, accepted.entry.media_type);
      if (!current || !["want_to_watch", "watching"].includes(current.status)) {
        throw new Error("Este título cambió en tu biblioteca. Volvé a cargar la página antes de continuar.");
      }
      if (current.status !== "watching") {
        const updated = await updateEntry(current.id, { status: "watching" });
        setEntries((prev) => prev.map((entry) => entry.id === updated.id ? updated : entry));
        event("watching", { entry_id: updated.id });
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos guardar el cambio. Intentá de nuevo.");
    } finally { savingRef.current = false; setSaving(false); }
  };
  const openDetails = (choice: Choice) => setDetail(choice.details ?? {
    tmdbId: choice.entry.tmdb_id, mediaType: choice.entry.media_type, title: choice.entry.title,
    originalTitle: choice.entry.title, overview: choice.entry.description ?? "", year: null, releaseDate: null,
    posterPath: choice.entry.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
  });
  const relevant = entries.filter((entry) => eligibleEntry(entry, filters));
  const missing = candidates.filter((candidate) => !candidate.details).length;

  const pending = entries.filter((e) => e.status === "want_to_watch").length;
  const watchingN = entries.filter((e) => e.status === "watching").length;
  const posters = entries.filter((e) => e.poster_path).slice(0, 14).map((e) => e.poster_path as string);
  const pill = (on: boolean) => `h-12 px-5 rounded-full text-sm font-extrabold border transition-colors disabled:opacity-40 ${on ? "bg-white text-[#111] border-white" : "border-white/25 text-white hover:bg-white/10"}`;
  const pick = accepted ?? choices[0];

  return <main className="w-full px-4 md:px-6 pt-20 pb-12 text-white">
    <PageHeader title="¿Qué vemos hoy?" eyebrow="Menos vueltas. Más historias." posters={posters}
      subtitle="Elegí entre lo que guardaste o descubrí películas nuevas según tu ADN audiovisual."
      stats={[{ v: relevant.length, l: "para explorar" }, { v: pending, l: "por ver" }, { v: watchingN, l: "viendo" }]}
      actions={<Link to="/inicio" className={button}>← Inicio</Link>} />

    <div className="liquid-glass rounded-full p-1.5 flex gap-1.5 w-full sm:w-fit mb-10" aria-label="Origen de las recomendaciones">
      {([{ value: "library", title: "Entre mis pendientes", short: "Pendientes", Icon: Bookmark }, { value: "dna", title: "Descubrir con mi ADN", short: "Descubrir", Icon: Compass }] as const).map((option) => (
        <button key={option.value} disabled={saving} aria-pressed={source === option.value} onClick={() => { resetResults(); setSource(option.value); }}
          className="flex-1 sm:flex-none h-14 px-4 sm:px-8 rounded-full text-sm sm:text-base font-extrabold transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
          style={{ background: source === option.value ? "#fff" : "transparent", color: source === option.value ? "#111" : "rgba(255,255,255,.85)" }}><option.Icon className="w-4 h-4 shrink-0" /><span className="sm:hidden">{option.short}</span><span className="hidden sm:inline">{option.title}</span></button>
      ))}
    </div>

    {source === "dna" ? <DnaDiscovery key={userId} /> : loading ? <p role="status" className="text-lg">Cargando tu biblioteca…</p> : loadError ? <div role="alert"><p className="text-lg">No pudimos cargar tu biblioteca.</p><button className={`${button} mt-4`} onClick={() => setRetry((n) => n + 1)}>Reintentar</button></div> : <>
      <fieldset disabled={busy || saving} className="min-w-0 border-t border-white/20 pt-6">
        <legend className="sr-only">Tu plan para hoy</legend>
        <h2 className="font-cinema text-4xl md:text-6xl leading-none mb-6">¿Cuál es el plan?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {tonightModes.map((mode, i) => {
            const on = filters.mode === mode.id;
            return (
              <button key={mode.id} aria-pressed={on} onClick={() => changeFilters({ ...filters, mode: mode.id, format: "all", minutes: null })}
                className="relative text-left rounded-[1.75rem] border p-5 min-h-[150px] flex flex-col justify-between transition-colors overflow-hidden focus-visible:outline-2 focus-visible:outline-white"
                style={on ? { background: "#fff", color: "#111", borderColor: "#fff" } : { background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.2)", boxShadow: "inset 2px 0 0 rgba(255,80,140,.3), inset -2px 0 0 rgba(70,170,255,.3)" }}>
                <span className="font-cinema text-5xl leading-none" style={{ color: on ? "rgba(17,17,17,.25)" : "transparent", WebkitTextStroke: on ? undefined : "1.5px rgba(255,255,255,.4)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span><span className="block text-lg font-extrabold leading-tight">{mode.label}</span><span className="block text-xs mt-1.5 opacity-70">{mode.hint}</span></span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-12 gap-y-6 items-end mt-8">
          {filters.mode !== "quick" && filters.mode !== "continue" && (
            <div><p className="text-xs font-extrabold uppercase tracking-widest text-white/65 mb-3">Formato</p>
              <div className="flex gap-2">{([["all", "Me da igual"], ["movie", "Película"], ["tv", "Serie"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => changeFilters({ ...filters, format: v, minutes: null })} className={pill(filters.format === v)}>{l}</button>)}</div></div>
          )}
          {filters.mode !== "continue" && filters.format !== "tv" && (
            <div><p className="text-xs font-extrabold uppercase tracking-widest text-white/65 mb-3">Tiempo para una película</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => changeFilters({ ...filters, minutes: null })} className={pill(filters.minutes === null)}>{filters.mode === "quick" ? "Hasta 90 min" : "Sin límite"}</button>
                {(filters.mode === "quick" ? [60, 90] : [60, 90, 120, 150, 180]).map((n) => <button key={n} type="button" onClick={() => changeFilters({ ...filters, minutes: n })} className={pill(filters.minutes === n)}>{n} min</button>)}
              </div></div>
          )}
          <button type="button" role="switch" aria-checked={filters.avoidHorror} onClick={() => changeFilters({ ...filters, avoidHorror: !filters.avoidHorror })} className="flex items-center gap-4 h-12">
            <span className="relative w-16 h-9 rounded-full border border-white/25 transition-colors shrink-0" style={{ background: filters.avoidHorror ? "#fff" : "rgba(255,255,255,.1)" }}>
              <span className="absolute top-1 w-7 h-7 rounded-full transition-all duration-300" style={{ left: filters.avoidHorror ? 32 : 4, background: filters.avoidHorror ? "#111" : "#fff" }} />
            </span>
            <span className="text-sm font-extrabold">Hoy sin terror</span>
          </button>
        </div>
        {filters.minutes !== null && <p className="text-xs text-white/65 mt-4">Con límite de tiempo buscamos solo películas con duración conocida.</p>}
        {filters.mode === "together" && <p className="text-xs text-white/65 mt-4">Elegimos por géneros de tu biblioteca. No implica contenido apto para menores ni compara los gustos del grupo.</p>}
        <button onClick={start} disabled={!relevant.length} className="mt-8 w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-[#111] rounded-full px-10 h-16 text-lg font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.02] disabled:opacity-40"><Shuffle size={20} />Encontrar mi próxima historia</button>
        <p className="mt-4 text-xs text-white/65">{relevant.length} títulos para explorar · Tu biblioteca solo cambia si lo confirmás.</p>
      </fieldset>

      {busy && <div role="status" className="mt-8 liquid-glass rounded-[2rem] p-6 flex flex-wrap items-center gap-5"><div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" /><p className="text-lg font-bold">Buscando entre tus títulos… {progress}/{relevant.length}</p><button className={`${button} ml-auto`} onClick={resetResults}>Cancelar búsqueda</button></div>}
      {!relevant.length && <div className="mt-8 border-t border-white/20 pt-6"><p className="text-lg">{filters.mode === "continue" ? "Todavía no tenés series en Viendo." : "No hay pendientes para este formato."}</p><Link to="/buscar" className="inline-block mt-3 underline">Buscar títulos para mi biblioteca →</Link></div>}

      {searched && <section className="mt-12" aria-label="Tu elección">
        <h2 ref={resultRef} tabIndex={-1} className="font-cinema text-5xl md:text-7xl leading-none outline-none mb-6">{accepted ? "Plan elegido" : choices.length ? "Esta puede ser tu noche" : "Probemos otro plan"}</h2>
        {missing > 0 && <p role="status" className="text-amber-200 text-sm mb-4">No pudimos consultar los datos de {missing} títulos. Solo entran en filtros que podamos comprobar. Podés volver a buscar para reintentar.</p>}
        {!choices.length ? <div className="border-t border-white/20 pt-6"><p className="text-lg">No quedan coincidencias con estos filtros y los descartes de esta visita. No cambiamos tus preferencias automáticamente.</p><div className="flex flex-wrap gap-3 mt-5"><button className={button} onClick={() => changeFilters(initialFilters)}>Probar sin filtros</button>{dismissed.size > 0 && <button className={button} onClick={() => { setDismissed(new Set()); event("reset_dismissals"); show(candidates, new Set()); }}>Recuperar descartados</button>}</div></div> : <>
          <article className="relative overflow-hidden rounded-[2.5rem] border border-white/20 p-6 md:p-10 grid md:grid-cols-[280px_minmax(0,1fr)] gap-8 items-end" style={{ boxShadow: EDGES }}>
            <img src={getPosterUrl(pick.entry.poster_path, "w342")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-60" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.75), rgba(8,7,14,.35))" }} />
            <div className="relative" style={{ perspective: 900 }}>
              <img src={getPosterUrl(pick.entry.poster_path, "w500")} alt="" className="w-full max-w-[280px] mx-auto aspect-[2/3] object-cover rounded-[2rem] border border-white/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,.85)]" />
            </div>
            <div className="relative min-w-0">
              <span className="liquid-glass-sm inline-flex px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest">{accepted ? "Tu elección" : "Nuestra propuesta"}</span>
              <h3 className="font-cinema text-5xl md:text-8xl leading-[0.98] mt-4 break-words">{pick.entry.title}</h3>
              <div className="liquid-glass rounded-[1.5rem] px-5 py-4 mt-5 max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-widest text-white/65">Por qué</p><p className="text-base font-bold mt-1 leading-snug">{pick.reason}</p></div>
              {pick.details?.overview && <p className="text-base text-white/80 mt-4 line-clamp-3 max-w-2xl text-pretty">{pick.details.overview}</p>}
              <div className="flex flex-wrap gap-3 mt-6">
                {!accepted && <button className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] text-base font-extrabold transition-transform hover:scale-[1.03]" onClick={() => accept(choices[0])}>Elegir esta <Check size={18} /></button>}
                <button className={`${button} !h-14 !px-8 !text-base`} disabled={saving} onClick={() => openDetails(pick)}>Ver ficha</button>
              </div>
            </div>
          </article>

          {accepted ? (
            <div className="mt-8 border-t border-white/20 pt-6 flex flex-wrap items-start gap-8">
              <div className="max-w-xl"><Check className="mb-3" size={28} /><p className="font-cinema text-4xl leading-none">Listo, ya tenés un plan.</p><p className="text-base text-white/75 mt-3">{saved || accepted.entry.status === "watching" ? "Este título está en Viendo." : "Tu elección quedó hecha. ¿Querés marcar el título como Viendo en tu biblioteca?"}</p></div>
              <div className="flex flex-wrap gap-3">
                {!saved && accepted.entry.status !== "watching" && <button className="inline-flex items-center h-14 px-8 rounded-full bg-white text-[#111] text-base font-extrabold" disabled={saving} onClick={markWatching}>{saving ? "Guardando…" : "Sí, pasar a Viendo"}</button>}
                <Link to="/biblioteca" className={`${button} !h-14 !px-8 !text-base`}>Ir a mi biblioteca →</Link>
                <button className={`${button} !h-14 !px-8 !text-base`} disabled={saving} onClick={resetResults}>Armar otro plan</button>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              {choices.length > 1 && <>
                <h3 className="font-cinema text-3xl md:text-4xl leading-none mb-5 border-t border-white/20 pt-6">Otras opciones</h3>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {choices.slice(1).map((choice) => (
                    <article key={choice.entry.id} className="group flex flex-col min-w-0">
                      <button onClick={() => accept(choice)} className="relative block aspect-[2/3] rounded-[1.75rem] overflow-hidden border border-white/25 shadow-[0_24px_50px_-14px_rgba(0,0,0,.8)] text-left">
                        <img src={getPosterUrl(choice.entry.poster_path, "w342")} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="liquid-glass absolute inset-x-2 bottom-2 rounded-2xl px-3 py-3"><p className="text-sm font-extrabold leading-tight line-clamp-2">{choice.entry.title}</p><p className="text-[11px] text-white/80 mt-1 line-clamp-2">{choice.reason}</p></div>
                      </button>
                      <button onClick={() => accept(choice)} className="mt-3 text-sm font-extrabold underline underline-offset-4 text-left">Prefiero esta →</button>
                    </article>
                  ))}
                </div>
              </>}
              <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/20 pt-6">
                <Clock size={22} className="text-white/70" /><p className="text-base text-white/75 max-w-xl">¿Ninguna te convence? Las dejamos de lado durante esta visita para mostrarte algo distinto.</p>
                <button className={`${button} !h-14 !px-8 !text-base`} onClick={() => { const next = new Set([...dismissed, ...choices.map((choice) => choice.entry.id)]); setDismissed(next); event("dismissed", { entry_ids: choices.map((choice) => choice.entry.id) }); show(candidates, next); }}>Otras opciones <ArrowRight className="inline ml-1" size={16} /></button>
              </div>
            </div>
          )}
        </>}
        {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
      </section>}
    </>}
    {detail && <MediaDetailModal result={detail} onClose={() => setDetail(null)} onSaved={(entry) => { setEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e)); resetResults(); }} />}
  </main>;
}
