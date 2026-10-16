import "@/styles/cinema.css";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Shuffle, Clock, Check, ArrowRight } from "lucide-react";
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

const initialFilters: TonightFilters = { mode: "surprise", format: "all", minutes: null, avoidHorror: false };
const button = "rounded-full px-5 py-3 text-sm font-bold border border-white/20 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-40 disabled:cursor-not-allowed";
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

  return <main className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-16 text-white">
    <Link to="/inicio" className="text-sm text-white/70 hover:text-white">← Volver al inicio</Link>
    <div className="mt-8 mb-10 max-w-3xl">
      <span className="text-xs uppercase tracking-[.2em] text-violet-300 font-bold">Menos vueltas. Más historias.</span>
      <h1 className="font-cinema text-5xl md:text-7xl mt-3">¿Qué vemos hoy?</h1>
      <p className="text-white/75 mt-4 text-lg">Elegí entre lo que guardaste o descubrí películas nuevas según tu ADN audiovisual.</p>
    </div>
    <div className="grid sm:grid-cols-2 gap-3 mb-7" aria-label="Origen de las recomendaciones">
      {([{ value: "library", title: "Entre mis pendientes", hint: "Elegir algo que ya quiero ver" }, { value: "dna", title: "Descubrir con mi ADN", hint: "Películas que todavía no guardé" }] as const).map((option) => <button key={option.value} disabled={saving} aria-pressed={source === option.value} onClick={() => { resetResults(); setSource(option.value); }} className={`text-left rounded-2xl p-5 border transition-colors ${source === option.value ? "bg-violet-200 text-[#171020] border-violet-200" : "border-white/20 hover:bg-white/10"}`}><span className="block font-extrabold">{option.title}</span><span className="block text-sm mt-1 opacity-70">{option.hint}</span></button>)}
    </div>
    {source === "dna" ? <DnaDiscovery key={userId} /> : loading ? <p role="status">Cargando tu biblioteca…</p> : loadError ? <div role="alert"><p>No pudimos cargar tu biblioteca.</p><button className={`${button} mt-4`} onClick={() => setRetry((n) => n + 1)}>Reintentar</button></div> : <>
      <fieldset disabled={busy || saving} className="liquid-glass rounded-[2rem] p-5 md:p-8 min-w-0">
        <legend className="sr-only">Tu plan para hoy</legend>
        <h2 className="font-cinema text-3xl mb-5">¿Cuál es el plan?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tonightModes.map((mode) => <button key={mode.id} aria-pressed={filters.mode === mode.id} onClick={() => changeFilters({ ...filters, mode: mode.id, format: "all", minutes: null })}
            className={`text-left rounded-2xl border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-white ${filters.mode === mode.id ? "bg-white text-[#111] border-white" : "border-white/15 hover:bg-white/10"}`}>
            <span className="block font-extrabold">{mode.label}</span><span className="block text-xs mt-1 opacity-70">{mode.hint}</span>
          </button>)}
        </div>
        <div className="flex flex-wrap gap-5 items-end mt-7">
          {filters.mode !== "quick" && filters.mode !== "continue" && <label className="text-sm font-bold">Formato<select value={filters.format} onChange={(e) => changeFilters({ ...filters, format: e.target.value as TonightFilters["format"], minutes: null })} className="block mt-2 bg-[#222] text-white border border-white/25 rounded-xl p-3"><option value="all">Me da igual</option><option value="movie">Película</option><option value="tv">Serie</option></select></label>}
          {filters.mode !== "continue" && filters.format !== "tv" && <label className="text-sm font-bold">Tiempo para una película<select value={filters.minutes ?? ""} onChange={(e) => changeFilters({ ...filters, minutes: e.target.value ? Number(e.target.value) : null })} className="block mt-2 bg-[#222] text-white border border-white/25 rounded-xl p-3"><option value="">{filters.mode === "quick" ? "Hasta 90 min" : "Sin límite"}</option>{(filters.mode === "quick" ? [60, 90] : [60, 90, 120, 150, 180]).map((n) => <option key={n} value={n}>Hasta {n} min</option>)}</select></label>}
          <label className="flex gap-2 items-center text-sm py-3"><input type="checkbox" checked={filters.avoidHorror} onChange={(e) => changeFilters({ ...filters, avoidHorror: e.target.checked })} />Hoy sin terror</label>
        </div>
        {filters.minutes !== null && <p className="text-xs text-white/65 mt-3">Con límite de tiempo buscamos solo películas con duración conocida.</p>}
        {filters.mode === "together" && <p className="text-xs text-white/65 mt-3">Elegimos por géneros de tu biblioteca. No implica contenido apto para menores ni compara los gustos del grupo.</p>}
        <button onClick={start} disabled={!relevant.length} className="mt-7 inline-flex items-center gap-2 bg-white text-[#111] rounded-full px-7 py-4 font-extrabold disabled:opacity-40"><Shuffle size={18} />Encontrar mi próxima historia</button>
        <p className="mt-3 text-xs text-white/65">{relevant.length} títulos para explorar · Tu biblioteca solo cambia si lo confirmás.</p>
      </fieldset>
      {busy && <div role="status" className="mt-6"><p>Buscando entre tus títulos… {progress}/{relevant.length}</p><button className={`${button} mt-3`} onClick={resetResults}>Cancelar búsqueda</button></div>}
      {!relevant.length && <div className="mt-6 liquid-glass rounded-2xl p-6"><p>{filters.mode === "continue" ? "Todavía no tenés series en Viendo." : "No hay pendientes para este formato."}</p><Link to="/buscar" className="inline-block mt-3 underline">Buscar títulos para mi biblioteca →</Link></div>}
      {searched && <section className="mt-10" aria-label="Tu elección">
        <h2 ref={resultRef} tabIndex={-1} className="font-cinema text-4xl outline-none">{accepted ? "Plan elegido" : choices.length ? "Esta puede ser tu noche" : "Probemos otro plan"}</h2>
        {missing > 0 && <p role="status" className="text-amber-200 text-sm mt-3">No pudimos consultar los datos de {missing} títulos. Solo entran en filtros que podamos comprobar. Podés volver a buscar para reintentar.</p>}
        {!choices.length ? <div className="mt-5 rounded-2xl border border-white/20 p-6"><p>No quedan coincidencias con estos filtros y los descartes de esta visita. No cambiamos tus preferencias automáticamente.</p><div className="flex flex-wrap gap-3 mt-4"><button className={button} onClick={() => changeFilters(initialFilters)}>Probar sin filtros</button>{dismissed.size > 0 && <button className={button} onClick={() => { setDismissed(new Set()); event("reset_dismissals"); show(candidates, new Set()); }}>Recuperar descartados</button>}</div></div> : <>
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-6 mt-6">
            <article className="liquid-glass rounded-[2rem] p-5 md:p-7">
              <img src={getPosterUrl((accepted ?? choices[0]).entry.poster_path)} alt="" className="w-36 md:w-44 aspect-[2/3] object-cover rounded-2xl mb-5" />
              <p className="text-xs uppercase tracking-widest text-violet-300">{accepted ? "Tu elección" : "Nuestra propuesta"}</p>
              <h3 className="font-cinema text-4xl mt-2">{(accepted ?? choices[0]).entry.title}</h3>
              <p className="text-sm text-white/80 mt-3">{(accepted ?? choices[0]).reason}</p>
              <p className="text-sm text-white/60 mt-3 line-clamp-3">{(accepted ?? choices[0]).details?.overview}</p>
              <div className="flex flex-wrap gap-3 mt-6">
                {!accepted && <button className={`${button} bg-white !text-[#111]`} onClick={() => accept(choices[0])}>Elegir esta <Check className="inline ml-1" size={16} /></button>}
                <button className={button} disabled={saving} onClick={() => openDetails(accepted ?? choices[0])}>Ver ficha</button>
              </div>
            </article>
            <div className="space-y-3">
              {!accepted && choices.slice(1).map((choice) => <article key={choice.entry.id} className="liquid-glass rounded-2xl p-5 flex gap-4"><img src={getPosterUrl(choice.entry.poster_path, "w200")} alt="" className="w-16 h-24 rounded-xl object-cover" /><div><h3 className="font-bold">{choice.entry.title}</h3><p className="text-xs text-white/70 mt-2">{choice.reason}</p><button onClick={() => accept(choice)} className="mt-3 text-sm underline">Prefiero esta →</button></div></article>)}
              {accepted ? <div className="rounded-2xl border border-violet-300/30 p-6"><Check className="text-violet-300 mb-3" /><p className="font-bold">Listo, ya tenés un plan.</p><p className="text-sm text-white/70 mt-2">{saved || accepted.entry.status === "watching" ? "Este título está en Viendo." : "Tu elección quedó hecha. ¿Querés marcar el título como Viendo en tu biblioteca?"}</p>{!saved && accepted.entry.status !== "watching" && <button className={`${button} mt-4`} disabled={saving} onClick={markWatching}>{saving ? "Guardando…" : "Sí, pasar a Viendo"}</button>}<Link to="/biblioteca" className="block mt-5 text-sm underline">Ir a mi biblioteca →</Link><button className={`${button} mt-4`} disabled={saving} onClick={resetResults}>Armar otro plan</button></div> : <div className="p-5"><Clock size={20} className="mb-3 text-violet-300" /><p className="text-sm text-white/70">¿Ninguna te convence? Las dejamos de lado durante esta visita para mostrarte algo distinto.</p><button className={`${button} mt-4`} onClick={() => { const next = new Set([...dismissed, ...choices.map((choice) => choice.entry.id)]); setDismissed(next); event("dismissed", { entry_ids: choices.map((choice) => choice.entry.id) }); show(candidates, next); }}>Otras opciones <ArrowRight className="inline ml-1" size={16} /></button></div>}
            </div>
          </div>
        </>}
        {error && <p role="alert" className="mt-4 text-red-300">{error}</p>}
      </section>}
    </>}
    {detail && <MediaDetailModal result={detail} onClose={() => setDetail(null)} onSaved={(entry) => { setEntries((prev) => prev.map((e) => e.id === entry.id ? entry : e)); resetResults(); }} />}
  </main>;
}
