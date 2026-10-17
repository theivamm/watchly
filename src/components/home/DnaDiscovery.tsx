import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/auth-context";
import { getMyDna } from "@/services/dna";
import { getUserLibrary, saveDiscovery } from "@/services/library";
import { getDnaMovieDiscoveries, getPosterUrl } from "@/services/tmdb";
import { getTasteProfile } from "@/services/taste";
import { explainTaste } from "@/lib/tasteProfile";
import { rankNewDnaMovies } from "@/lib/dnaDiscovery";
import { track } from "@/lib/telemetry";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import { EDGES } from "@/components/ui/PageHeader";
import type { TMDBSearchResult } from "@/types";

const button = "inline-flex items-center justify-center h-11 px-6 rounded-full liquid-glass-sm text-sm font-extrabold text-white hover:text-white transition-transform hover:scale-[1.02] disabled:opacity-40";
type Recommendation = ReturnType<typeof rankNewDnaMovies>[number];

export default function DnaDiscovery() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const [accepted, setAccepted] = useState<Recommendation | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const savingRef = useRef(false);
  const [decisionId] = useState(() => crypto.randomUUID());
  const recommendations = useQuery({
    queryKey: ["tonight-dna-discovery", user?.id],
    enabled: !!user,
    staleTime: 0,
    queryFn: async () => {
      // Exclusion must be based on the entire library, not just the watchlist.
      const [dna, library] = await Promise.all([getMyDna(user!.id), getUserLibrary(user!.id)]);
      if (!dna || dna.status === "locked" || !dna.topGenres.length) return { dna, items: [], ready: false };
      const taste = await getTasteProfile(library, dna.topGenres);
      const items = await getDnaMovieDiscoveries(taste.genres.map((genre) => genre.key));
      return { dna, items: rankNewDnaMovies(items, library, taste.genres).map((choice) => ({ ...choice, reason: explainTaste(choice.item, taste) })), ready: true };
    },
  });
  const pool = recommendations.data?.items ?? [];
  const choices = pool.filter(({ item }) => !dismissed.has(item.tmdbId) && !savedIds.has(item.tmdbId)).slice(0, 3);
  const choose = (choice: Recommendation) => {
    setAccepted(choice); setMessage(""); setError("");
    track("tonight_dna_accepted", { decision_id: decisionId, tmdb_id: choice.item.tmdbId });
  };
  const save = async (status: "want_to_watch" | "watching") => {
    if (!user || !accepted || savingRef.current) return;
    savingRef.current = true; setSaving(true); setError("");
    try {
      const entry = await saveDiscovery(user.id, accepted.item, status);
      setSavedIds((prev) => new Set([...prev, accepted.item.tmdbId]));
      setMessage(entry.status === status ? status === "watching" ? "Guardada en Viendo. ¡Buen plan!" : "Guardada en Quiero ver." : "La película ya estaba en tu biblioteca. Conservamos su estado y tus datos.");
      track("tonight_dna_saved", { decision_id: decisionId, tmdb_id: accepted.item.tmdbId, status: entry.status });
    } catch {
      setError("No pudimos guardar la película. Intentá de nuevo.");
    } finally { savingRef.current = false; setSaving(false); }
  };
  return <section className="min-w-0 border-t border-white/20 pt-6" aria-label="Descubrir con mi ADN">
    <span className="liquid-glass-sm inline-flex px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest">Fuera de tu biblioteca</span>
    <h2 className="font-cinema text-4xl md:text-6xl leading-none mt-4">Historias nuevas, con algo de vos</h2>
    <p className="text-white/75 mt-4 text-base max-w-2xl">Películas recomendadas por tus estrellas y los géneros de tu ADN. Excluimos todos los títulos que ya guardaste, incluso los vistos, en pausa y abandonados.</p>
    {recommendations.isPending ? <p role="status" className="mt-8 text-lg">Consultando tu ADN y buscando películas nuevas…</p> : recommendations.isError ? <div role="alert" className="mt-8"><p className="text-lg">No pudimos consultar tu ADN, biblioteca o catálogo.</p><button className={`${button} mt-3`} onClick={() => recommendations.refetch()}>Reintentar</button></div> : !recommendations.data.ready ? <div className="mt-8 border-t border-white/20 pt-6"><p className="text-lg">Necesitás desbloquear tu ADN para recibir recomendaciones basadas en tus gustos.</p><Link className="block underline mt-3" to="/adn">Ver mi ADN y cómo completarlo →</Link></div> : <>
      <p className="text-xs text-white/60 mt-4">Tus valoraciones positivas aumentan la afinidad; las bajas la reducen. Sin valoraciones suficientes usamos el ADN como orientación. {recommendations.data.dna?.status === "early" ? "Tu ADN todavía es preliminar." : ""}</p>
      {accepted ? <article className="relative overflow-hidden rounded-[2.5rem] border border-white/20 mt-8 p-6 md:p-10 grid md:grid-cols-[260px_minmax(0,1fr)] gap-8 items-end" style={{ boxShadow: EDGES }}>
        <img src={getPosterUrl(accepted.item.posterPath, "w342")} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-60" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(8,7,14,.75), rgba(8,7,14,.35))" }} />
        <img src={getPosterUrl(accepted.item.posterPath, "w500")} alt="" className="relative w-full max-w-[260px] mx-auto aspect-[2/3] object-cover rounded-[2rem] border border-white/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,.85)]" />
        <div className="relative min-w-0">
          <span className="liquid-glass-sm inline-flex px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest">Tu elección</span>
          <h3 className="font-cinema text-5xl md:text-7xl leading-[0.98] mt-4 break-words">{accepted.item.title}</h3>
          <div className="liquid-glass rounded-[1.5rem] px-5 py-4 mt-5 max-w-2xl"><p className="text-base font-bold leading-snug">{accepted.reason}</p></div>
          <p className="text-base mt-4 text-white/80 max-w-2xl">{message || "Elegirla no modifica tu biblioteca. Podés guardarla para después o empezar a verla."}</p>
          <div className="flex flex-wrap gap-3 mt-6">
            {!message && <><button className={`${button} !h-14 !px-8 !text-base`} disabled={saving} onClick={() => save("want_to_watch")}>{saving ? "Guardando…" : "Guardar en Quiero ver"}</button><button className="inline-flex items-center h-14 px-8 rounded-full bg-white text-[#111] text-base font-extrabold disabled:opacity-40" disabled={saving} onClick={() => save("watching")}>Empezar a verla</button></>}
            <button className={`${button} !h-14 !px-8 !text-base`} disabled={saving} onClick={() => { setDismissed((prev) => new Set([...prev, accepted.item.tmdbId])); setAccepted(null); setMessage(""); setError(""); }}>Seguir descubriendo</button>
          </div>
          {error && <p role="alert" className="text-red-300 mt-3">{error}</p>}
        </div>
      </article> : choices.length ? <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">{choices.map((choice) => <article key={choice.item.tmdbId} className="group relative overflow-hidden rounded-[2.25rem] border border-white/20 min-h-[30rem] flex flex-col justify-end" style={{ boxShadow: "inset 3px 0 0 rgba(255,80,140,.4), inset -3px 0 0 rgba(70,170,255,.4), 0 30px 60px -20px rgba(0,0,0,.7)" }}>
          <img src={getPosterUrl(choice.item.posterPath, "w500")} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, rgba(7,7,13,.85))" }} />
          <span className="liquid-glass-sm absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-extrabold">Película · {choice.item.year ?? "Sin fecha"}</span>
          <div className="liquid-glass relative m-3 rounded-[1.75rem] p-5">
            <h3 className="font-cinema text-3xl leading-none">{choice.item.title}</h3>
            <p className="text-sm font-bold mt-3 leading-snug">{choice.reason}</p>
            <p className="text-xs text-white/75 mt-2 line-clamp-2">{choice.item.overview}</p>
            <div className="flex flex-wrap gap-2 mt-4"><button className="inline-flex items-center h-11 px-6 rounded-full bg-white text-[#111] text-sm font-extrabold" onClick={() => choose(choice)}>Elegir esta</button><button className={button} onClick={() => setSelected(choice.item)}>Ver ficha</button></div>
          </div>
        </article>)}</div>
        <button className={`${button} mt-8 !h-14 !px-8 !text-base`} onClick={() => { setDismissed((prev) => new Set([...prev, ...choices.map(({ item }) => item.tmdbId)])); track("tonight_dna_dismissed", { decision_id: decisionId, tmdb_ids: choices.map(({ item }) => item.tmdbId) }); }}>Mostrar otras películas →</button>
      </> : <div className="mt-8 border-t border-white/20 pt-6"><p className="text-lg">No quedan películas nuevas en esta selección del catálogo para tu ADN.</p>{dismissed.size > 0 && <button className={`${button} mt-3`} onClick={() => setDismissed(new Set())}>Volver a ver descartadas</button>}<Link to="/buscar" className="block underline mt-4">Explorar el catálogo →</Link></div>}
    </>}
    {selected && <MediaDetailModal result={selected} onClose={() => setSelected(null)} onSaved={(entry) => { setSavedIds((prev) => new Set([...prev, entry.tmdb_id])); recommendations.refetch(); }} />}
  </section>;
}
