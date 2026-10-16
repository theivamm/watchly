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
import type { TMDBSearchResult } from "@/types";

const button = "rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:bg-white/10 disabled:opacity-40";
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
  return <section className="liquid-glass rounded-[2rem] p-5 md:p-8" aria-label="Descubrir con mi ADN">
    <p className="text-violet-200 text-xs uppercase tracking-widest font-bold">Fuera de tu biblioteca</p>
    <h2 className="font-cinema text-4xl mt-3">Historias nuevas, con algo de vos</h2>
    <p className="text-white/70 mt-3 max-w-2xl">Películas recomendadas por tus estrellas y los géneros de tu ADN. Excluimos todos los títulos que ya guardaste, incluso los vistos, en pausa y abandonados.</p>
    {recommendations.isPending ? <p role="status" className="mt-6">Consultando tu ADN y buscando películas nuevas…</p> : recommendations.isError ? <div role="alert" className="mt-6"><p>No pudimos consultar tu ADN, biblioteca o catálogo.</p><button className={`${button} mt-3`} onClick={() => recommendations.refetch()}>Reintentar</button></div> : !recommendations.data.ready ? <div className="mt-6 rounded-2xl border border-white/20 p-6"><p>Necesitás desbloquear tu ADN para recibir recomendaciones basadas en tus gustos.</p><Link className="block underline mt-3" to="/adn">Ver mi ADN y cómo completarlo →</Link></div> : <>
      <p className="text-xs text-white/60 mt-4">Tus valoraciones positivas aumentan la afinidad; las bajas la reducen. Sin valoraciones suficientes usamos el ADN como orientación. {recommendations.data.dna?.status === "early" ? "Tu ADN todavía es preliminar." : ""}</p>
      {accepted ? <div className="mt-7 rounded-3xl border border-violet-300/30 p-6">
        <h3 className="font-cinema text-3xl">Tu elección: {accepted.item.title}</h3><p className="mt-2 text-white/75">{accepted.reason}</p>
        <p className="text-sm mt-4">{message || "Elegirla no modifica tu biblioteca. Podés guardarla para después o empezar a verla."}</p>
        <div className="flex flex-wrap gap-3 mt-5">
          {!message && <><button className={button} disabled={saving} onClick={() => save("want_to_watch")}>{saving ? "Guardando…" : "Guardar en Quiero ver"}</button><button className={`${button} bg-white !text-[#111]`} disabled={saving} onClick={() => save("watching")}>Empezar a verla</button></>}
          <button className={button} disabled={saving} onClick={() => { setDismissed((prev) => new Set([...prev, accepted.item.tmdbId])); setAccepted(null); setMessage(""); setError(""); }}>Seguir descubriendo</button>
        </div>{error && <p role="alert" className="text-red-300 mt-3">{error}</p>}
      </div> : choices.length ? <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-7">{choices.map((choice) => <article key={choice.item.tmdbId} className="rounded-3xl border border-white/15 overflow-hidden bg-black/15 flex flex-col">
          <img src={getPosterUrl(choice.item.posterPath)} alt="" className="w-full aspect-[2/3] max-h-80 object-cover" />
          <div className="p-5 flex flex-col flex-1"><p className="text-xs text-white/60">Película · {choice.item.year ?? "Sin fecha"}</p><h3 className="font-cinema text-3xl mt-2">{choice.item.title}</h3><p className="text-violet-200 text-sm mt-3">{choice.reason}</p><p className="text-xs text-white/65 mt-3 line-clamp-3">{choice.item.overview}</p><div className="flex flex-wrap gap-2 mt-auto pt-5"><button className={button} onClick={() => choose(choice)}>Elegir esta</button><button className={button} onClick={() => setSelected(choice.item)}>Ver ficha</button></div></div>
        </article>)}</div>
        <button className={`${button} mt-6`} onClick={() => { setDismissed((prev) => new Set([...prev, ...choices.map(({ item }) => item.tmdbId)])); track("tonight_dna_dismissed", { decision_id: decisionId, tmdb_ids: choices.map(({ item }) => item.tmdbId) }); }}>Mostrar otras películas →</button>
      </> : <div className="mt-6 rounded-2xl border border-white/20 p-6"><p>No quedan películas nuevas en esta selección del catálogo para tu ADN.</p>{dismissed.size > 0 && <button className={`${button} mt-3`} onClick={() => setDismissed(new Set())}>Volver a ver descartadas</button>}<Link to="/buscar" className="block underline mt-4">Explorar el catálogo →</Link></div>}
    </>}
    {selected && <MediaDetailModal result={selected} onClose={() => setSelected(null)} onSaved={(entry) => { setSavedIds((prev) => new Set([...prev, entry.tmdb_id])); recommendations.refetch(); }} />}
  </section>;
}
