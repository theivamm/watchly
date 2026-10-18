import "@/styles/cinema.css";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCw, Sparkles, BookOpen, Users, Share2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getMyDna, calculateDna } from "@/services/dna";
import { getUserLibrary } from "@/services/library";
import { getMediaDetails } from "@/services/tmdb";
import type { UserDNA } from "@/types";
import DNAView, { type DnaPoster } from "@/components/dna/DNAView";
import { usePageTitle } from "@/hooks/usePageTitle";

const whiteBtn = "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03] disabled:opacity-50";

function LockedState({ dna }: { dna: UserDNA }) {
  const pct = Math.round(Math.min(dna.validTitleCount / 5, 1) * 100);
  return (
    <div className="max-w-3xl mx-auto liquid-glass rounded-[2.75rem] p-8 md:p-14 text-center text-white">
      <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-widest mb-6"><Sparkles className="w-3.5 h-3.5" /> ADN Audiovisual</span>
      <h1 className="font-cinema text-5xl md:text-7xl leading-[1.02] mb-4">Tu ADN está tomando forma</h1>
      <p className="text-base leading-relaxed mb-9 text-white/80">Agregá 5 títulos que hayas visto para descubrir los primeros rasgos de tu perfil.</p>

      <div className="max-w-md mx-auto mb-10">
        <div className="flex items-center justify-between mb-2.5 text-sm font-extrabold"><span>{dna.validTitleCount} de 5 títulos</span><span>{pct}%</span></div>
        <div className="h-3.5 rounded-full bg-white/12 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#fff", boxShadow: "0 0 18px rgba(255,255,255,.5)" }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[{ icon: BookOpen, text: "Los géneros que más te marcan" }, { icon: Users, text: "Creadores que vuelven" }, { icon: Share2, text: "Una pieza para compartir" }].map(({ icon: Icon, text }) => (
          <div key={text} className="frost-card rounded-[1.5rem] p-5">
            <Icon className="w-5 h-5 mx-auto mb-2.5 text-white/70" />
            <p className="text-xs font-extrabold leading-snug">{text}</p>
          </div>
        ))}
      </div>
      <Link to="/buscar" className={whiteBtn}>Agregar títulos</Link>
    </div>
  );
}

export default function DNAPage() {
  usePageTitle("Mi ADN Audiovisual | Watchly");
  const { user, profile, refreshProfile } = useAuth();
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [posters, setPosters] = useState<DnaPoster[]>([]);

  // Género, año, país, idioma y duración no se guardan en la biblioteca: se piden a TMDB una vez por título y se recuerdan en el navegador.
  useEffect(() => {
    if (!user) return;
    let off = false;
    type Meta = { g: number[]; y: number | null; c: string[]; l: string; r: number | null };
    const key = (t: string, id: number) => `watchly:meta2:${t}-${id}`;
    getUserLibrary(user.id).then(async (es) => {
      const ents = es.filter((e) => e.poster_path);
      const m = new Map<string, Meta>();
      ents.forEach((e) => { try { const raw = localStorage.getItem(key(e.media_type, e.tmdb_id)); if (raw) m.set(key(e.media_type, e.tmdb_id), JSON.parse(raw)); } catch { /* sin caché */ } });
      const build = () => ents.map((e): DnaPoster => {
        const x = m.get(key(e.media_type, e.tmdb_id));
        return { path: e.poster_path as string, title: e.title, rating: e.rating ?? null, type: e.media_type, genreIds: x?.g, year: x?.y ?? null, countries: x?.c, lang: x?.l, runtime: x?.r ?? null };
      });
      if (off) return;
      setPosters(build());
      const missing = [...ents].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).filter((e) => !m.has(key(e.media_type, e.tmdb_id))).slice(0, 60);
      for (let i = 0; i < missing.length && !off; i += 5) {
        await Promise.all(missing.slice(i, i + 5).map((e) => getMediaDetails(e.media_type as "movie" | "tv", e.tmdb_id).then((d) => {
          const meta: Meta = { g: d.genreIds, y: d.year ?? null, c: d.countries ?? [], l: d.originalLanguage ?? "", r: d.runtime };
          m.set(key(e.media_type, e.tmdb_id), meta);
          try { localStorage.setItem(key(e.media_type, e.tmdb_id), JSON.stringify(meta)); } catch { /* cuota */ }
        }).catch(() => {})));
        if (!off) setPosters(build());
      }
    }).catch(() => {});
    return () => { off = true; };
  }, [user]);

  const load = useCallback(async (force = false) => {
    if (!user) return;
    setLoading(true);
    setError("");
    setStale(false);
    try {
      const stored = await getMyDna(user.id);
      let result = stored;
      if (!stored || profile?.dna_dirty || force) {
        try {
          result = await calculateDna(force);
          void refreshProfile();
        } catch {
          if (!stored) throw new Error("No pudimos actualizar tu ADN en este momento.");
          setStale(true);
        }
      }
      setDna(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar tu ADN en este momento.");
    } finally {
      setLoading(false);
    }
  }, [user, profile?.dna_dirty, refreshProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRecalc = async () => {
    if (recalculating) return;
    setRecalculating(true);
    setError("");
    try {
      await load(true);
    } finally {
      setRecalculating(false);
    }
  };

  const shell = "w-full px-4 md:px-6 pt-20 pb-12 text-white";

  if (loading && !dna) {
    return (
      <div className={`${shell} space-y-6`}>
        <div className="h-96 liquid-glass rounded-[2.75rem] animate-pulse" />
        <div className="grid md:grid-cols-2 gap-6">{[0, 1].map((i) => <div key={i} className="h-64 frost-card rounded-[2.25rem] animate-pulse" />)}</div>
      </div>
    );
  }

  if (error && !dna) {
    return (
      <div className={`${shell} max-w-3xl`}>
        <div className="liquid-glass rounded-[2.5rem] p-10 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-white/80" />
          <h1 className="font-cinema text-4xl leading-none mb-3">No pudimos actualizar tu ADN</h1>
          <p className="text-sm mb-7 text-white/75">{error} El módulo de ADN necesita que la edge function calculate-user-dna esté desplegada en Supabase.</p>
          <button onClick={() => load(true)} className={whiteBtn}><RotateCw className="w-4 h-4" /> Volver a intentar</button>
        </div>
      </div>
    );
  }

  if (!dna) return null;

  if (dna.status === "locked") {
    return <div className={shell}><LockedState dna={dna} /></div>;
  }

  const showUpdateButton = stale || profile?.dna_dirty === true;

  return (
    <div className={shell}>
      {dna.status === "early" && (
        <div className="liquid-glass-sm rounded-[1.75rem] px-6 py-4 mb-6 text-sm font-extrabold">
          Estas son las primeras señales de tu ADN. Va a cambiar a medida que agregues más títulos.
        </div>
      )}
      <DNAView
        dna={dna}
        title="Mi ADN"
        posters={posters}
        actions={showUpdateButton ? (
          <button onClick={handleRecalc} disabled={recalculating} className="liquid-glass-sm inline-flex items-center gap-2 h-10 px-5 rounded-full text-xs font-extrabold text-white disabled:opacity-50">
            <RotateCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Actualizando..." : stale ? "Resultado desactualizado · Actualizar" : "Actualizar ADN"}
          </button>
        ) : undefined}
      />
    </div>
  );
}
