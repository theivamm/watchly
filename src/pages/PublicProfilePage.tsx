import "@/styles/cinema.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Share2, Check, MapPin, Globe, Aperture, X, Lock, Film, Layers, Clapperboard, Star, LayoutGrid, Tv,
  Bookmark, Play, CheckCheck, Pause, XCircle, ChevronDown, Dna, Pencil, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/app/auth-context";
import { getProfileByUsername, getProfileLink, getMediaShareLink } from "@/services/profile";
import { getPublicLists, getList } from "@/services/lists";
import { getPublicLibrary } from "@/services/library";
import { getPublicDnaByUsername } from "@/services/dna";
import MediaCard from "@/components/media/MediaCard";
import MediaDetailModal from "@/components/media/MediaDetailModal";
import Avatar from "@/components/ui/Avatar";
import { getPosterUrl } from "@/services/tmdb";
import type { Profile, List, Entry, EntryStatus, TMDBSearchResult, ListItem, UserDNA } from "@/types";
import { usePageTitle } from "@/hooks/usePageTitle";

type Section = "resumen" | "quierover" | "peliculas" | "series" | "listas";

const STATUS_META: Record<EntryStatus, { label: string; color: string; icon: typeof Bookmark }> = {
  want_to_watch: { label: "Quiero ver", color: "hsl(265 90% 78%)", icon: Bookmark },
  watching: { label: "Viendo", color: "hsl(145 70% 65%)", icon: Play },
  completed: { label: "Completado", color: "hsl(210 90% 72%)", icon: CheckCheck },
  paused: { label: "Pausado", color: "hsl(48 95% 68%)", icon: Pause },
  dropped: { label: "Abandonado", color: "hsl(0 90% 74%)", icon: XCircle },
};
const STATUS_ORDER: EntryStatus[] = ["completed", "watching", "want_to_watch", "paused", "dropped"];

const label = "text-xs font-extrabold uppercase tracking-widest text-white/60";

function PosterTile({ entry, onClick, wide = false }: { entry: Entry; onClick: () => void; wide?: boolean }) {
  const meta = STATUS_META[entry.status];
  const Icon = meta.icon;
  return (
    <button type="button" onClick={onClick} title={entry.title}
      className={`group relative shrink-0 snap-start aspect-[2/3] rounded-[1.5rem] overflow-hidden border border-white/15 shadow-[0_20px_44px_-16px_rgba(0,0,0,.7)] transition-transform duration-500 hover:-translate-y-1.5 text-left ${wide ? "w-[190px] md:w-[220px]" : "w-full"}`}>
      <img src={getPosterUrl(entry.poster_path, "w342")} alt={entry.title} loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.85))" }} />
      <span className="liquid-glass-sm absolute top-2.5 left-2.5 w-8 h-8 rounded-full flex items-center justify-center" style={{ color: meta.color }} title={meta.label}>
        <Icon className="w-4 h-4" />
      </span>
      {entry.rating != null && entry.rating > 0 && (
        <span className="liquid-glass-sm absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-extrabold text-white">
          <Star className="w-3 h-3" fill="currentColor" /> {entry.rating}
        </span>
      )}
      <p className="absolute left-3 right-3 bottom-3 text-xs font-extrabold leading-tight line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{entry.title}</p>
    </button>
  );
}

function CoverCycle({ covers }: { covers: Entry[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (covers.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % covers.length), 5000);
    return () => clearInterval(t);
  }, [covers.length]);
  return (
    <>
      {covers.map((entry, k) => (
        <img key={entry.id} src={getPosterUrl(entry.poster_path, "w500")} alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2400ms] ease-in-out"
          style={{ opacity: k === i ? 1 : 0, filter: "blur(44px) saturate(1.4)", transform: "scale(1.35)" }} />
      ))}
    </>
  );
}

export default function PublicProfilePage() {
  const { username = "" } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  usePageTitle(
    `Perfil de ${profile?.display_name || `@${username}`} | Watchly`,
    `${profile?.bio || `Biblioteca pública de ${profile?.display_name || `@${username}`}`} — películas, series y listas en Watchly.`,
  );
  const [lists, setLists] = useState<List[]>([]);
  const [listPreviews, setListPreviews] = useState<Record<string, ListItem[]>>({});
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dna, setDna] = useState<UserDNA | null>(null);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<Section>("resumen");
  const [statusFilter, setStatusFilter] = useState<EntryStatus | "all">("all");
  const [readOnlyEntry, setReadOnlyEntry] = useState<Entry | null>(null);
  const [viewResult, setViewResult] = useState<TMDBSearchResult | null>(null);
  const [activeShareUrl, setActiveShareUrl] = useState<string | null>(null);

  const isOwner = user?.id === profile?.id;

  useEffect(() => {
    setProfile(undefined);
    setLists([]);
    setListPreviews({});
    setExpandedListId(null);
    setEntries([]);
    setDna(null);
    setSection("resumen");
    setReadOnlyEntry(null);
    setViewResult(null);
    setActiveShareUrl(null);
    getProfileByUsername(username)
      .then(async (p) => {
        setProfile(p);
        if (p && p.is_profile_public) {
          const [l, e, d] = await Promise.all([
            getPublicLists(p.id).catch(() => []),
            getPublicLibrary(p.id).catch(() => []),
            p.show_dna_publicly ? getPublicDnaByUsername(username).catch(() => null) : Promise.resolve(null),
          ]);
          setLists(l);
          setEntries(e);
          setDna(d);
        }
      })
      .catch(() => setProfile(null));
  }, [username]);

  const movies = useMemo(() => entries.filter((e) => e.media_type === "movie"), [entries]);
  const series = useMemo(() => entries.filter((e) => e.media_type === "tv"), [entries]);
  const wantToWatch = useMemo(() => entries.filter((e) => e.status === "want_to_watch"), [entries]);
  const watching = useMemo(() => entries.filter((e) => e.status === "watching"), [entries]);
  const favorites = useMemo(() => entries.filter((e) => (e.rating ?? 0) >= 4), [entries]);
  const recent = entries.slice(0, 16);
  const rated = useMemo(() => entries.filter((e) => (e.rating ?? 0) > 0), [entries]);
  const avgRating = rated.length ? rated.reduce((a, e) => a + (e.rating ?? 0), 0) / rated.length : 0;
  const statusCounts = useMemo(
    () => STATUS_ORDER.map((s) => ({ status: s, count: entries.filter((e) => e.status === s).length })),
    [entries],
  );

  const filtered = useMemo(() => {
    const base = section === "quierover" ? wantToWatch : section === "peliculas" ? movies : series;
    if (section === "quierover" || statusFilter === "all") return base;
    return base.filter((e) => e.status === statusFilter);
  }, [section, movies, series, wantToWatch, statusFilter]);

  const heroCovers = useMemo(() => entries.filter((e) => e.poster_path).slice(0, 6), [entries]);

  useEffect(() => {
    if (!profile?.is_profile_public || lists.length === 0) {
      setListPreviews({});
      return;
    }
    let cancelled = false;
    (async () => {
      const data: Record<string, ListItem[]> = {};
      await Promise.all(
        lists.map(async (list) => {
          try {
            const { items } = await getList(list.id);
            data[list.id] = items;
          } catch {
            data[list.id] = [];
          }
        }),
      );
      if (!cancelled) setListPreviews(data);
    })();
    return () => { cancelled = true; };
  }, [profile?.is_profile_public, lists]);

  const handleShare = async () => {
    if (!profile?.username) return;
    try {
      await navigator.clipboard.writeText(getProfileLink(profile.username));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const whiteBtn = "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-white text-[#111] hover:text-[#111] text-sm font-extrabold shadow-[0_12px_40px_rgba(0,0,0,.35)] transition-transform hover:scale-[1.03]";

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (profile === null || (!profile.is_profile_public && !isOwner)) {
    const priv = profile !== null;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center text-white">
        <div className="liquid-glass rounded-[2.5rem] px-10 py-12 max-w-md">
          <div className="liquid-glass-sm w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center">
            {priv ? <Lock className="w-9 h-9" /> : <span className="font-cinema text-4xl">?</span>}
          </div>
          <h1 className="font-cinema text-5xl leading-none mb-3">{priv ? "Perfil privado" : "Perfil no encontrado"}</h1>
          <p className="text-sm mb-7 text-white/75">
            {priv ? `${profile!.display_name || profile!.username} no compartió su perfil.` : "Este perfil no existe o cambió su usuario."}
          </p>
          <Link to="/" className={whiteBtn}>Ir a Watchly</Link>
        </div>
      </div>
    );
  }

  const socials = [
    profile.website_url && { icon: Globe, href: profile.website_url, key: "web" },
    profile.instagram_url && { icon: Aperture, href: `https://instagram.com/${profile.instagram_url.replace(/^@/, "")}`, key: "ig" },
    profile.x_url && { icon: X, href: `https://x.com/${profile.x_url.replace(/^@/, "")}`, key: "x" },
  ].filter(Boolean) as { icon: typeof Globe; href: string; key: string }[];

  const sections: { key: Section; label: string; icon: typeof Film; count: number }[] = [
    { key: "resumen", label: "Resumen", icon: LayoutGrid, count: entries.length },
    { key: "quierover", label: "Por ver", icon: Bookmark, count: wantToWatch.length },
    { key: "peliculas", label: "Películas", icon: Clapperboard, count: movies.length },
    { key: "series", label: "Series", icon: Tv, count: series.length },
    { key: "listas", label: "Listas", icon: Layers, count: lists.length },
  ];

  const toResult = (entry: Entry): TMDBSearchResult => ({
    tmdbId: entry.tmdb_id, mediaType: entry.media_type, title: entry.title, originalTitle: entry.title,
    overview: "", year: null, releaseDate: null, posterPath: entry.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
  });

  const openCard = (entry: Entry) => {
    setActiveShareUrl(getMediaShareLink(profile.username, entry.media_type, entry.tmdb_id));
    setReadOnlyEntry(user ? null : entry);
    setViewResult(toResult(entry));
  };

  const openListItem = (item: ListItem) => {
    setActiveShareUrl(getMediaShareLink(profile.username, item.media_type, item.tmdb_id));
    setViewResult({
      tmdbId: item.tmdb_id, mediaType: item.media_type, title: item.title, originalTitle: item.title,
      overview: "", year: null, releaseDate: null, posterPath: item.poster_path, backdropPath: null, genreIds: [], tmdbRating: null,
    });
  };

  const Empty = ({ msg }: { msg: string }) => (
    <div className="frost-card flex flex-col items-center justify-center py-16 rounded-[2.5rem]">
      <Film className="w-8 h-8 mb-3 text-white/70" />
      <p className="text-sm font-bold text-white/75">{msg}</p>
    </div>
  );

  const Heading = ({ children, aside }: { children: string; aside?: React.ReactNode }) => (
    <div className="flex items-end justify-between gap-4 mb-5">
      <h2 className="font-cinema text-4xl md:text-5xl leading-none">{children}</h2>
      {aside}
    </div>
  );

  const Grid = ({ items }: { items: Entry[] }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-5">
      {items.map((e) => (
        <MediaCard key={e.id} tmdbId={e.tmdb_id} title={e.title} posterPath={e.poster_path} year={null} mediaType={e.media_type}
          status={e.status} rating={e.rating} notes={e.notes} onClick={() => openCard(e)} />
      ))}
    </div>
  );

  const ListCard = ({ list }: { list: List }) => {
    const items = listPreviews[list.id] ?? [];
    const posters = items.filter((i) => i.poster_path).slice(0, 4).map((i) => i.poster_path as string);
    const expanded = expandedListId === list.id;
    return (
      <div className="frost-card overflow-hidden rounded-[2.25rem]">
        <button onClick={() => setExpandedListId(expanded ? null : list.id)} className="group relative block w-full h-52 text-left overflow-hidden">
          {posters.length > 0 && (
            <div className="absolute inset-0 grid h-full w-full" style={{ gridTemplateColumns: `repeat(${posters.length}, 1fr)` }}>
              {posters.map((p, i) => (
                <img key={i} src={getPosterUrl(p, "w342")} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              ))}
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(7,7,13,.3), transparent 35%, rgba(7,7,13,.6))" }} />
          <span className="liquid-glass-sm absolute top-4 left-4 px-3 py-1.5 rounded-full text-[11px] font-extrabold">{items.length} {items.length === 1 ? "título" : "títulos"}</span>
          <span className="liquid-glass-sm absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-300" style={{ transform: expanded ? "rotate(180deg)" : "none" }}>
            <ChevronDown className="w-4 h-4" />
          </span>
          <div className="liquid-glass absolute left-3.5 right-3.5 bottom-3.5 rounded-[1.5rem] px-5 py-3.5">
            <h3 className="font-cinema text-3xl leading-none truncate">{list.name}</h3>
            {list.description && <p className="text-xs mt-1.5 line-clamp-1 text-white/75">{list.description}</p>}
          </div>
        </button>
        {expanded && (
          <div className="p-6 animate-slide-up border-t border-white/10">
            {items.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {items.map((item) => (
                  <MediaCard key={item.id} tmdbId={item.tmdb_id} title={item.title} posterPath={item.poster_path} year={null} mediaType={item.media_type} onClick={() => openListItem(item)} />
                ))}
              </div>
            ) : (
              <p className="text-sm py-6 text-center text-white/70">Esta lista todavía no tiene títulos.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const Resumen = () => (
    <div className="space-y-12">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="liquid-glass rounded-[2.25rem] p-7 lg:col-span-2">
          <p className={label}>Su cine en números</p>
          <div className="flex h-4 rounded-full overflow-hidden bg-white/10 mt-5">
            {statusCounts.filter((s) => s.count > 0).map((s) => (
              <div key={s.status} title={`${STATUS_META[s.status].label}: ${s.count}`}
                style={{ width: `${(s.count / Math.max(entries.length, 1)) * 100}%`, background: STATUS_META[s.status].color }} />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
            {statusCounts.map(({ status, count }) => {
              const m = STATUS_META[status];
              const Icon = m.icon;
              return (
                <div key={status}>
                  <p className="font-cinema text-4xl leading-none" style={{ color: m.color }}>{count}</p>
                  <p className="text-[11px] font-bold mt-2 inline-flex items-center gap-1.5 text-white/75"><Icon className="w-3.5 h-3.5" /> {m.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {dna && dna.status !== "locked" ? (
          <Link to={`/perfil/${profile.username}/adn`} className="liquid-glass group relative overflow-hidden rounded-[2.25rem] p-7 flex flex-col text-white hover:text-white transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <p className={label}>ADN Audiovisual</p>
              <Dna className="w-5 h-5" style={{ color: "var(--accent)" }} />
            </div>
            <p className="font-cinema text-4xl leading-tight mt-4">{dna.topGenres.slice(0, 3).map((g) => g.label).join(" · ")}</p>
            {dna.decadeDistribution[0] && <p className="text-sm mt-2 text-white/75">Década dominante: {dna.decadeDistribution[0].label}</p>}
            <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-sm font-extrabold" style={{ color: "var(--accent-light)" }}>
              Ver ADN completo <ArrowUpRight className="w-4 h-4" />
            </span>
          </Link>
        ) : (
          <div className="liquid-glass rounded-[2.25rem] p-7 flex flex-col">
            <p className={label}>Nota promedio</p>
            <p className="font-cinema text-7xl leading-none mt-4" style={{ color: "var(--accent)" }}>{avgRating ? avgRating.toFixed(1) : "—"}</p>
            <p className="text-sm mt-2 text-white/75">{rated.length} {rated.length === 1 ? "título calificado" : "títulos calificados"}</p>
          </div>
        )}
      </div>

      {favorites.length > 0 && (
        <section>
          <Heading aside={<span className="text-sm font-bold text-white/60">{favorites.length} con 4★ o más</span>}>Destacadas</Heading>
          <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x pb-4 -mx-1 px-1">
            {favorites.slice(0, 14).map((e) => <PosterTile key={e.id} entry={e} wide onClick={() => openCard(e)} />)}
          </div>
        </section>
      )}

      {watching.length > 0 && (
        <section>
          <Heading>Viendo ahora</Heading>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {watching.slice(0, 6).map((e) => (
              <button key={e.id} onClick={() => openCard(e)} className="frost-card flex items-center gap-4 p-3 rounded-[1.75rem] text-left transition-transform hover:-translate-y-1">
                <img src={getPosterUrl(e.poster_path, "w200")} alt={e.title} className="w-16 aspect-[2/3] object-cover rounded-2xl" />
                <div className="min-w-0">
                  <p className="font-extrabold truncate">{e.title}</p>
                  <p className="text-xs mt-1 text-white/65">{e.media_type === "movie" ? "Película" : "Serie"}</p>
                  {e.notes && <p className="text-xs mt-2 line-clamp-2 text-white/75">{e.notes}</p>}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <Heading aside={<button onClick={() => setSection("peliculas")} className="text-sm font-extrabold hover:opacity-80" style={{ color: "var(--accent-light)" }}>Ver todo →</button>}>Últimos agregados</Heading>
        {recent.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8 gap-4">
            {recent.map((e) => <PosterTile key={e.id} entry={e} onClick={() => openCard(e)} />)}
          </div>
        ) : <Empty msg="Este perfil todavía no agregó títulos." />}
      </section>

      {lists.length > 0 && (
        <section>
          <Heading aside={<button onClick={() => setSection("listas")} className="text-sm font-extrabold hover:opacity-80" style={{ color: "var(--accent-light)" }}>Ver todas →</button>}>Listas</Heading>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lists.slice(0, 3).map((l) => <ListCard key={l.id} list={l} />)}
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="w-full px-5 md:px-10 py-8 md:py-10 max-w-[1500px] mx-auto text-white">
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/20 mb-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,.7)]">
        <div className="absolute inset-0 bg-[#0b0b14]">
          <CoverCycle covers={heroCovers} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(7,7,13,.75), rgba(7,7,13,.35) 60%, rgba(7,7,13,.6))" }} />
        </div>

        <div className="relative z-10 p-7 md:p-12 flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 min-w-0 flex-1">
            <div className="relative shrink-0 rounded-full p-1.5" style={{ background: "var(--gradient-accent)", boxShadow: "0 24px 60px -12px var(--accent)" }}>
              <div className="rounded-full overflow-hidden bg-[#0b0b14] p-1"><Avatar profile={profile} size={132} /></div>
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <span className="liquid-glass-sm inline-flex items-center px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider" style={{ color: "var(--accent-light)" }}>
                @{profile.username}
              </span>
              <h1 className="font-cinema mt-3 text-6xl md:text-8xl leading-[1.02] drop-shadow-[0_10px_50px_rgba(0,0,0,.5)] break-words">
                {profile.display_name || profile.username}
              </h1>
              {profile.bio && <p className="mt-3 text-base leading-relaxed max-w-2xl text-white/85 text-pretty">{profile.bio}</p>}
              {(profile.location || socials.length > 0) && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
                  {profile.location && (
                    <span className="liquid-glass-sm inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>
                  )}
                  {socials.map(({ icon: Icon, href, key }) => (
                    <a key={key} href={href} target="_blank" rel="noreferrer" className="liquid-glass-sm w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-white hover:scale-110 transition-transform"><Icon className="w-4 h-4" /></a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-4 shrink-0">
            <div className="liquid-glass rounded-[2rem] px-3 py-4 flex">
              {[
                { icon: Clapperboard, n: movies.length, l: "Películas" },
                { icon: Tv, n: series.length, l: "Series" },
                { icon: Star, n: favorites.length, l: "Favoritas" },
                { icon: Layers, n: lists.length, l: "Listas" },
              ].map(({ icon: Icon, n, l }, i) => (
                <div key={l} className="px-4 text-center" style={{ borderLeft: i ? "1px solid rgba(255,255,255,.14)" : "none" }}>
                  <Icon className="w-4 h-4 mx-auto mb-1.5 text-white/60" />
                  <p className="font-cinema text-3xl leading-none" style={{ color: "var(--accent)" }}>{n}</p>
                  <p className="text-[10px] font-extrabold mt-1.5 uppercase tracking-wider text-white/70">{l}</p>
                </div>
              ))}
            </div>
            {isOwner ? (
              <Link to="/configuracion/perfil" className={whiteBtn}><Pencil className="w-4 h-4" /> Editar perfil</Link>
            ) : (
              <button onClick={handleShare} className={whiteBtn}>
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "¡Link copiado!" : "Compartir perfil"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ───────── NAV ───────── */}
      <nav className="liquid-glass sticky top-4 z-30 rounded-full p-2 mb-10 flex gap-1.5 overflow-x-auto no-scrollbar">
        {sections.map(({ key, label: l, icon: Icon, count }) => {
          const active = section === key;
          return (
            <button key={key} onClick={() => { setSection(key); setStatusFilter("all"); }}
              className="flex items-center gap-2 px-5 h-11 rounded-full text-sm font-extrabold whitespace-nowrap transition-all"
              style={{ background: active ? "#fff" : "transparent", color: active ? "#111" : "rgba(255,255,255,.85)" }}>
              <Icon className="w-4 h-4" />
              {l}
              <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: active ? "rgba(0,0,0,.1)" : "rgba(255,255,255,.14)" }}>{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {section === "resumen" && <Resumen />}

        {(section === "quierover" || section === "peliculas" || section === "series") && (
          <div className="space-y-6">
            <Heading aside={<span className="liquid-glass-sm px-4 py-2 rounded-full text-xs font-extrabold">{filtered.length} {filtered.length === 1 ? "título" : "títulos"}</span>}>
              {section === "quierover" ? "Por ver" : section === "peliculas" ? "Películas" : "Series"}
            </Heading>
            {section !== "quierover" && (
              <div className="flex gap-2.5 flex-wrap">
                <button onClick={() => setStatusFilter("all")} data-active={statusFilter === "all"} className="frost-tab !py-2 !px-4 !text-xs">Todos</button>
                {STATUS_ORDER.map((s) => {
                  const m = STATUS_META[s];
                  const Icon = m.icon;
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)} data-active={statusFilter === s} className="frost-tab !py-2 !px-4 !text-xs">
                      <Icon className="w-3.5 h-3.5" style={{ color: statusFilter === s ? "#111" : m.color }} /> {m.label}
                    </button>
                  );
                })}
              </div>
            )}
            {filtered.length > 0 ? <Grid items={filtered} /> : <Empty msg="No hay títulos con este filtro." />}
          </div>
        )}

        {section === "listas" && (
          <div className="space-y-6">
            <Heading>Listas</Heading>
            {lists.length > 0 ? (
              <div className="grid gap-5 lg:grid-cols-2">{lists.map((l) => <ListCard key={l.id} list={l} />)}</div>
            ) : <Empty msg="Este perfil todavía no compartió listas." />}
          </div>
        )}
      </div>

      {viewResult && (
        <MediaDetailModal
          result={viewResult}
          shareUrl={activeShareUrl}
          readOnlyEntry={readOnlyEntry}
          onClose={() => { setViewResult(null); setReadOnlyEntry(null); setActiveShareUrl(null); }}
          onSaved={() => {
            setViewResult(null);
            setReadOnlyEntry(null);
            setActiveShareUrl(null);
            if (profile) getPublicLibrary(profile.id).then(setEntries).catch(console.error);
          }}
        />
      )}
    </div>
  );
}
