import "@/styles/cinema.css";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Plus, RotateCw, Sparkles, Info, Search, Dna } from "lucide-react";
import HeroBackdrop from "@/components/home/HeroBackdrop";
import { useHeroCycle } from "@/hooks/useHeroCycle";
import { useAuth } from "@/app/auth-context";
import HorizontalCarousel from "@/components/media/HorizontalCarousel";
import PosterFrame from "@/components/media/PosterFrame";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import { addToLibrary, getUserLibrary } from "@/services/library";
import { getMyDna } from "@/services/dna";
import { getDnaRecommendations, getKoreanRecommendations, getExploreRows, getSimilarTo, getPosterUrl, getBackdropUrl } from "@/services/tmdb";
import { getTasteProfile } from "@/services/taste";
import { explainTaste, tasteScore, type TasteProfile } from "@/lib/tasteProfile";
import { genreLabel } from "@/lib/genres";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Entry, MediaType, TMDBSearchResult } from "@/types";

interface Row {
  id: string;
  title: string;
  subtitle: string;
  /** Motivo fijo para filas que no salen de tus géneros. */
  note?: string;
  items: TMDBSearchResult[];
}

const FALLBACK_GENRES = [
  { key: "28", label: "Acción" },
  { key: "35", label: "Comedia" },
  { key: "18", label: "Drama" },
  { key: "878", label: "Ciencia ficción" },
  { key: "53", label: "Thriller" },
];

export default function RecommendationsPage() {
  usePageTitle("Para vos | Watchly");
  const { user } = useAuth();
  const [taste, setTaste] = useState<TasteProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDna, setHasDna] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<TMDBSearchResult | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const refresh = () => { if (user) getUserLibrary(user.id).then(setEntries).catch(console.error); };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    let cancelled = false;
    (async () => {
      const [dna, library] = await Promise.all([getMyDna(user.id), getUserLibrary(user.id)]);
      const profile = await getTasteProfile(library, dna?.topGenres ?? []);
      if (!cancelled) { setEntries(library); setTaste(profile); }
      const genres = profile.genres.length ? profile.genres.slice(0, 5) : profile.ratedCount ? [] : FALLBACK_GENRES;
      const format = dna?.formatDistribution ?? { movie: 1, tv: 1 };
      if (!cancelled) setHasDna(!!dna && dna.topGenres.length > 0);

      // Lo que calificaste con 4 o 5: las mejores notas primero, y entre iguales las más recientes.
      const loved = library
        .filter((e) => (e.rating ?? 0) >= 4 && e.status !== "want_to_watch")
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
        .slice(0, 5);

      const [genreRows, lovedRows, explore, korea] = await Promise.all([
        Promise.all(genres.map(async (g) => ({
          id: `g-${g.key}`,
          title: g.label,
          subtitle: profile.ratedCount ? "Afinidad según tus valoraciones" : "Exploración por género",
          items: (await getDnaRecommendations([g.key], format).catch(() => [])).sort((a, b) => tasteScore(b, profile) - tasteScore(a, profile)),
        }))),
        Promise.all(loved.map(async (e): Promise<Row> => ({
          id: `s-${e.media_type}-${e.tmdb_id}`,
          title: `Porque te gustó «${e.title}»`,
          subtitle: `Le diste ${e.rating} ${e.rating === 1 ? "estrella" : "estrellas"} · ${e.media_type === "movie" ? "películas" : "series"} parecidas`,
          note: `Le gustó a la gente que también disfrutó «${e.title}», que calificaste con ${e.rating} ${e.rating === 1 ? "estrella" : "estrellas"}.`,
          items: await getSimilarTo(e.media_type, e.tmdb_id).catch(() => []),
        }))),
        getExploreRows().catch(() => []),
        getKoreanRecommendations(),
      ]);
      if (cancelled) return;
      const dnaGenres = new Set(genreRows.map((r) => r.id.slice(2)));
      // Intercala las filas por título entre las de género, para que no queden todas al final.
      const personal: Row[] = [];
      genreRows.forEach((r, i) => { personal.push(r); if (lovedRows[i]) personal.push(lovedRows[i]); });
      personal.push(...lovedRows.slice(genreRows.length));
      setRows([
        ...personal,
        ...explore.filter((x) => !x.genre || !dnaGenres.has(x.genre)),
        { id: "kdrama", title: "K-Dramas", subtitle: "Series coreanas destacadas", note: "Selección de series coreanas destacadas; no se basa en tus estrellas.", items: korea.dramas },
        { id: "kmovies", title: "Cine coreano", subtitle: "Películas de Corea del Sur", note: "Selección de cine coreano destacado; no se basa en tus estrellas.", items: korea.movies },
      ]);
      setLoading(false);
    })().catch(() => { if (!cancelled) { setLoadError(true); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const inLibrary = (i: TMDBSearchResult) => entries.some((e) => e.tmdb_id === i.tmdbId && e.media_type === i.mediaType);

  // Destacados: alterna entre filas (1° de cada género, luego 2°…) para variar.
  const heroItems = useMemo(() => {
    if (!hasDna) return [];
    const pools = rows.filter((row) => row.id.startsWith("g-")).map((r) => r.items.filter((i) => i.backdropPath && i.posterPath && i.overview && !inLibrary(i)));
    const seen = new Set<string>();
    const out: TMDBSearchResult[] = [];
    for (let depth = 0; out.length < 7 && pools.some((p) => p.length > depth); depth++) {
      for (const p of pools) {
        const it = p[depth];
        if (!it) continue;
        const k = `${it.mediaType}-${it.tmdbId}`;
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(it);
        if (out.length >= 7) break;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, hasDna, entries]);
  const hero = useHeroCycle(heroItems.map((i) => i.posterPath));
  const visibleRows = rows.map((r) => ({ ...r, items: r.items.filter((i) => !inLibrary(i)) })).filter((r) => r.items.length > 0);
  const reasonFor = (it: TMDBSearchResult, _genre?: string) => taste ? explainTaste(it, taste) : "Selección para explorar el catálogo.";

  const quickAdd = async (item: TMDBSearchResult) => {
    if (!user || adding) return;
    const key = `${item.mediaType}-${item.tmdbId}`;
    setAdding(key);
    try {
      await addToLibrary(user.id, {
        tmdbId: item.tmdbId, mediaType: item.mediaType as MediaType, title: item.title, posterPath: item.posterPath,
        status: "want_to_watch", rating: null, description: item.overview || undefined,
      });
      setJustAdded(key);
      setTimeout(() => setJustAdded(null), 1800);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="w-full text-white">
      {heroItems.length > 0 ? (
        <section className="relative min-h-[78svh] flex flex-col overflow-hidden">
          <HeroBackdrop soft items={heroItems} index={hero.index} glow={hero.glow} glow2={hero.glow2} />

          <div className="relative z-10 flex-1 flex items-center px-5 md:px-14 pt-28 pb-6">
            <div className="grid max-w-3xl">
              {heroItems.map((it, i) => {
                const key = `${it.mediaType}-${it.tmdbId}`;
                const on = i === hero.index;
                return (
                  <div key={key} className="[grid-area:1/1] transition-all duration-1000"
                    style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 18}px)`, pointerEvents: on ? "auto" : "none" }}>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {it.year && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{it.year}</span>}
                      <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{it.mediaType === "movie" ? "Película" : "Serie"}</span>
                      {genreLabel(it.genreIds) && <span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-bold">{genreLabel(it.genreIds)}</span>}
                      {it.tmdbRating ? (
                        <span className="px-4 py-2 rounded-full text-xs font-extrabold text-[#111] bg-white">★ {it.tmdbRating.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <h1 className="font-cinema mt-6 mb-5 text-5xl md:text-7xl leading-[1.02] line-clamp-3 drop-shadow-[0_10px_60px_rgba(0,0,0,.5)]">{it.title}</h1>
                    <p className="text-base md:text-lg leading-relaxed font-medium text-white/85 max-w-xl line-clamp-3 text-pretty">{it.overview}</p>
                    <div className="liquid-glass rounded-[1.5rem] px-5 py-4 mt-6 max-w-xl flex gap-3 items-start">
                      <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="min-w-0"><p className="text-[11px] font-extrabold uppercase tracking-widest text-white/65">Por qué te la recomendamos</p><p className="text-sm font-bold mt-1 leading-snug line-clamp-2">{reasonFor(it)}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-6">
                      <button type="button" onClick={() => setSelected(it)}
                        className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] active:scale-95">
                        <Info className="w-5 h-5" /> Ver detalles
                      </button>
                      <button type="button" onClick={() => quickAdd(it)} disabled={adding === key}
                        className="liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-60">
                        {adding === key ? <RotateCw className="w-5 h-5 animate-spin" /> : justAdded === key ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {justAdded === key ? "¡Agregada a Por ver!" : "Quiero verla"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex items-end gap-3.5 overflow-x-auto no-scrollbar px-5 md:px-14 pb-12 pt-2">
            {heroItems.map((it, i) => {
              const on = i === hero.index;
              return (
                <button key={`${it.mediaType}-${it.tmdbId}`} type="button" onClick={() => hero.select(i)} aria-label={it.title}
                  className="shrink-0 flex flex-col gap-2.5 transition-all duration-700" style={{ width: on ? 110 : 76 }}>
                  <img src={getPosterUrl(it.posterPath, "w342")} alt={it.title} className="w-full object-cover rounded-[1.1rem] transition-all duration-700"
                    style={{ aspectRatio: "2/3", border: `1px solid rgba(255,255,255,${on ? 0.6 : 0.18})`, boxShadow: `0 20px 40px rgba(0,0,0,.45), 0 0 0 ${on ? 2 : 0}px rgba(255,255,255,.9)` }} />
                  <span className="h-[3px] rounded-full bg-white/20 overflow-hidden" style={{ opacity: on ? 1 : 0 }}>
                    <span key={hero.cycle} className="block h-full hero-progress" style={{ animationDuration: `${hero.duration}ms`, background: "#fff" }} />
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : !loading && !hasDna ? (
        <section className="px-4 md:px-6 pt-24">
          <div className="liquid-glass relative overflow-hidden rounded-[2.5rem] p-8 md:p-14">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[110px] pointer-events-none" style={{ background: "rgba(255,255,255,.14)" }} />
            <div className="relative max-w-2xl">
              <span className="liquid-glass-sm w-14 h-14 rounded-full flex items-center justify-center mb-6"><Dna className="w-7 h-7" /></span>
              <h1 className="font-cinema text-5xl md:text-7xl leading-none">Todavía no te conocemos</h1>
              <p className="text-base md:text-lg mt-5 text-white/80 leading-relaxed">
                Para recomendarte películas y series a tu medida necesitamos tu ADN. Andá agregando títulos a tu biblioteca y calificándolos: con unos pocos ya podemos armarte destacados personalizados.
              </p>
              <p className="text-sm mt-3 text-white/60">Mientras tanto, abajo tenés géneros populares y lo mejor de Corea.</p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link to="/buscar" className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white text-[#111] text-sm font-extrabold transition-transform hover:scale-[1.03]">
                  <Search className="w-5 h-5" /> Agregar títulos
                </Link>
                <Link to="/adn" className="liquid-glass-sm inline-flex items-center justify-center gap-2 h-14 px-7 rounded-full text-sm font-bold text-white hover:text-white transition-transform hover:scale-[1.03]">
                  <Dna className="w-5 h-5" /> Ver mi ADN
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="px-4 md:px-6 pt-12 pb-24">
      <header className="mb-12 border-t border-white/20 pt-6">
        <h2 className="font-cinema text-5xl md:text-7xl leading-none">Por género</h2>
        <p className="text-sm md:text-base mt-3 text-white/70 max-w-xl">
          {hasDna ? "Tus estrellas orientan la afinidad. Pasá el mouse por una portada para ver por qué te la recomendamos." : "Géneros populares mientras armamos tu ADN."}
        </p>
      </header>

      {loadError && <p role="alert" className="mb-6 text-red-300">No pudimos consultar tus preferencias. Recargá para reintentar.</p>}
      {loading ? (
        <div className="flex justify-center py-24"><RotateCw className="w-6 h-6 animate-spin text-white/60" /></div>
      ) : (
        <div className="space-y-14">
          {visibleRows.map((row, ri) => {
            const items = row.items;
            const lead = items.find((i) => i.backdropPath);
            const isGenre = row.id.startsWith("g-");
            const fade = "linear-gradient(270deg, #000 0%, transparent 100%)";
            return (
              <section key={row.id} className="relative">
                {lead && <img src={getBackdropUrl(lead.backdropPath, "w780")} alt="" aria-hidden="true" className="absolute -top-6 right-0 w-[70%] h-56 object-cover opacity-30 pointer-events-none" style={{ WebkitMaskImage: fade, maskImage: fade }} />}
                <div className="relative flex items-end gap-5 mb-5">
                  <span className="font-cinema text-7xl md:text-9xl leading-[0.8] text-transparent select-none" style={{ WebkitTextStroke: "2px rgba(255,255,255,.4)" }}>{String(ri + 1).padStart(2, "0")}</span>
                  <div className="pb-1 min-w-0"><h2 className="font-cinema text-4xl md:text-6xl leading-none">{row.title}</h2><p className="text-sm mt-2 text-white/70">{row.subtitle}</p></div>
                </div>
                <HorizontalCarousel className="gap-5 pt-2 pb-6">
                  {items.map((it) => {
                    const key = `${it.mediaType}-${it.tmdbId}`;
                    return (
                      <div key={key} className="group relative w-[180px] md:w-[210px] shrink-0 snap-start">
                        <button type="button" onClick={() => setSelected(it)} className="block w-full text-left">
                          <PosterFrame src={getPosterUrl(it.posterPath, "w342")} alt={it.title} rounded="rounded-[1.75rem]" border="border-white/25">
                            <span className="liquid-glass-sm absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold">{it.mediaType === "movie" ? "Película" : "Serie"}</span>
                            <div className="liquid-glass absolute inset-x-2 bottom-2 rounded-2xl px-3 py-2.5 transition-all duration-300 group-hover:opacity-0">
                              <p className="text-sm font-extrabold truncate">{it.title}</p>
                              <div className="flex items-center justify-between gap-2 text-[11px] text-white/80 mt-0.5"><span className="truncate">{genreLabel(it.genreIds) || (it.year ?? "")}</span>{it.tmdbRating ? <span className="shrink-0 font-extrabold">★ {it.tmdbRating.toFixed(1)}</span> : null}</div>
                            </div>
                            <div className="liquid-glass absolute inset-x-2 bottom-2 rounded-2xl px-3 py-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                              <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">Por qué</p>
                              <p className="text-xs font-bold leading-snug mt-1 line-clamp-5">{isGenre ? reasonFor(it, row.id.slice(2)) : row.note ?? "Selección editorial; no se basa en tus estrellas."}</p>
                            </div>
                          </PosterFrame>
                        </button>
                        <button type="button" onClick={() => quickAdd(it)} disabled={adding === key} title="Agregar a Por ver"
                          className="liquid-glass-sm absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                          {adding === key ? <RotateCw className="w-4 h-4 animate-spin" /> : justAdded === key ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
                </HorizontalCarousel>
              </section>
            );
          })}
        </div>
      )}
      </div>

      {selected && <MediaDetailModal result={selected} onClose={() => setSelected(null)} onSaved={refresh} />}
    </div>
  );
}
